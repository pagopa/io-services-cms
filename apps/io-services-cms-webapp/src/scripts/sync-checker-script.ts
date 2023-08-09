/**
 * Script to check if the sync process is working properly.
 *
 * This script will:
 * 1. Retrieve all service from ServiceLifecycle collection
 * 2. For each service, map to legacy format usign the cmsToLegacy function from onHistoryChange
 * 3. Retrieve the last version of the corrispondig service from the legacy collection
 * 4. Compare the two services and log the result
 */
import fs from "fs";
import os from "os";
import { QueryIterator } from "@azure/cosmos";
import {
  Queue,
  ServiceHistory,
  ServiceLifecycle,
} from "@io-services-cms/models";
import {
  RetrievedService,
  SERVICE_COLLECTION_NAME,
  ServiceModel,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "../config";
import { getDatabase } from "../lib/azure/cosmos";
import { cosmosdbClient } from "../utils/cosmos-legacy";
import { cmsToLegacy } from "../watchers/on-service-history-change";

type ProcessPhases =
  | "LIFECYCLE_RETRIEVE"
  | "LIFECYCLE_MAPPING"
  | "LEGACY_RETRIEVE"
  | "COMPARE";

type InvalidItem = {
  itemId: NonEmptyString;
  error: string;
  processPhase: ProcessPhases;
};

/* eslint-disable no-console */
const logger = {
  info: (message: string) =>
    console.log(
      `[INFO][SYNC CHECK PROCEDURE][${new Date().toISOString()}] => ${message}`
    ),
  error: (message: string) =>
    console.error(
      `[ERROR][SYNC CHECK PROCEDURE][${new Date().toISOString()}] => ${message}`
    ),
};

// Deps
const config = getConfigOrThrow();

// client to interact with cms db
const cosmos = getDatabase(config);

// create a store for the ServiceLifecycle finite state machine
const ServiceLifecycleContainer = cosmos.container(
  config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE
);

// legacyService Container instance
const legacyServicesContainer = cosmosdbClient
  .database(config.LEGACY_COSMOSDB_NAME)
  .container(SERVICE_COLLECTION_NAME);

const legacyServiceModel = new ServiceModel(legacyServicesContainer);

const MAX_ITEMS_PER_CHUNK = 100;
const RESULT_PATH = `${os.homedir()}/sync_check_result`;
const INVALID_ITEMS_CSV_FILE_PATH = `${RESULT_PATH}/invalid_items.csv`;
const CONTINUATION_TOKEN_FILE = `${RESULT_PATH}/continuation_token.txt`;

const getContinuationToken = (): string | undefined => {
  if (fs.existsSync(CONTINUATION_TOKEN_FILE)) {
    const continuationToken = fs
      .readFileSync(CONTINUATION_TOKEN_FILE, "utf8")
      .trim();
    logger.info(`Resuming Continuation token: ${continuationToken}`);
    return continuationToken;
  }
  logger.info(
    `Starting from beginnging casue no file, ${CONTINUATION_TOKEN_FILE} was not present`
  );
  return undefined;
};

const writeContinuationToken = (continuationToken: string) => {
  if (continuationToken) {
    fs.writeFileSync(CONTINUATION_TOKEN_FILE, continuationToken);
  } else {
    // Se non c'è continuationToken, significa che abbiamo finito; possiamo cancellare il file.
    if (fs.existsSync(CONTINUATION_TOKEN_FILE)) {
      fs.unlinkSync(CONTINUATION_TOKEN_FILE);
    }
  }
};

const buildInvalidItem = (
  id: NonEmptyString,
  error: string,
  processPhase: ProcessPhases
): InvalidItem => ({
  itemId: id,
  error,
  processPhase,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const retrieveNextChunk = (queryIterator: QueryIterator<any>) => async () => {
  const { resources: itemsChunk, continuationToken } =
    await queryIterator.fetchNext();

  const res = itemsChunk.reduce(
    (acc, item) => {
      const validationResult = ServiceLifecycle.ItemType.decode(item);

      if (E.isRight(validationResult)) {
        return {
          ...acc,
          validItems: [...acc.validItems, validationResult.right],
        };
      } else {
        logger.error(`Item ${item.id} is not valid: ${validationResult.left}`);
        // L'elemento non è valido secondo il codec
        return {
          ...acc,
          invalidItems: [
            ...acc.invalidItems,
            buildInvalidItem(
              item.id,
              JSON.stringify(validationResult.left),
              "LIFECYCLE_RETRIEVE"
            ),
          ],
        };
      }
    },
    {
      validItems: [] as ServiceLifecycle.ItemType[],
      invalidItems: [] as InvalidItem[],
    }
  );

  logger.info(
    `Next chunk retreived from ServiceLifecycle, validItems: ${res.validItems.length}, invalidItems: ${res.invalidItems.length}`
  );

  return {
    ...res,
    continuationToken,
  };
};

const appendInvalidItemsToCSV = (invalidItems: InvalidItem[]) => {
  invalidItems.forEach((invalidItem) => {
    const csvLine = `${invalidItem.itemId};${invalidItem.error};${invalidItem.processPhase}`;
    fs.appendFileSync(INVALID_ITEMS_CSV_FILE_PATH, csvLine + "\n");
  });
};

const lifeCycleAndLegacyEquals = (
  lifecycleItem: Queue.RequestSyncLegacyItem,
  legacyItem: RetrievedService
): E.Either<InvalidItem, void> => {
  const legacyItemWithoutId = { ...legacyItem };

  const lifecycleItemWithoutId = { ...lifecycleItem };

  if (
    JSON.stringify(legacyItemWithoutId) !==
    JSON.stringify(lifecycleItemWithoutId)
  ) {
    const errorMessage = `Item ${lifecycleItem.serviceId} mapped is not equal to last legacy version`;
    logger.error(errorMessage);
    return E.left(
      buildInvalidItem(lifecycleItem.serviceId, errorMessage, "COMPARE")
    );
  }

  return E.right(void 0);
};

const mapToLegacy = (
  lifecycleItem: ServiceLifecycle.ItemType
): E.Either<InvalidItem, Queue.RequestSyncLegacyItem> => {
  try {
    const mapped = cmsToLegacy(lifecycleItem as unknown as ServiceHistory);
    return E.right(mapped);
  } catch (error) {
    logger.error(
      `Error while mapping lifecycle item ${lifecycleItem.id} to legacy: ${error}`
    );
    return E.left(
      buildInvalidItem(
        lifecycleItem.id,
        JSON.stringify(error),
        "LIFECYCLE_MAPPING"
      )
    );
  }
};

const retrieveLegacyService = (
  id: NonEmptyString
): TE.TaskEither<InvalidItem, RetrievedService> =>
  pipe(
    legacyServiceModel.findLastVersionByModelId([id]),
    TE.mapLeft((err) => {
      logger.error(
        `Error while retrieving legacy item ${id}: ${JSON.stringify(err)}`
      );
      return buildInvalidItem(id, JSON.stringify(err), "LEGACY_RETRIEVE");
    }),
    TE.chain(
      O.fold(() => {
        logger.error(`Item ${id} not found in legacy`);
        return TE.left(
          buildInvalidItem(id, "Item not found in legacy", "LEGACY_RETRIEVE")
        );
      }, TE.right)
    )
  );

const checkItemOnLegacy = (
  lifecycleItem: ServiceLifecycle.ItemType
): TE.TaskEither<InvalidItem, void> =>
  pipe(
    lifecycleItem,
    mapToLegacy,
    TE.fromEither,
    TE.chainW((mapped) =>
      pipe(
        retrieveLegacyService(lifecycleItem.id),
        TE.chain((legacyItem) =>
          pipe(lifeCycleAndLegacyEquals(mapped, legacyItem), TE.fromEither)
        )
      )
    ),
    TE.map((_) => void 0)
  );

const checkItemsOnLegacy = (
  lifecycleItems: ServiceLifecycle.ItemType[]
): T.Task<InvalidItem[]> =>
  pipe(
    lifecycleItems,
    RA.traverse(T.ApplicativePar)(checkItemOnLegacy), // Esegue checkItemOnLegacy per ogni elemento
    T.map((results) => {
      const errors = results.filter(E.isLeft).map((e) => e.left); // Filtra gli errori e mappa a InvalidItem
      return errors.length > 0 ? errors : [];
    })
  );

const main = async () => {
  logger.info("Starting ...");
  // Create filesystem result folder
  if (!fs.existsSync(RESULT_PATH)) {
    fs.mkdirSync(RESULT_PATH);
    logger.info(`Created folder ${RESULT_PATH}`);
  }
  const initialContinuationToken = getContinuationToken();
  const query = "SELECT * FROM c";
  const queryIterator = ServiceLifecycleContainer.items.query(query, {
    maxItemCount: MAX_ITEMS_PER_CHUNK,
    continuationToken: initialContinuationToken,
  });

  while (queryIterator.hasMoreResults()) {
    const chunk = await retrieveNextChunk(queryIterator)();

    // Check items on legacy
    const checkResult = await checkItemsOnLegacy(chunk.validItems)();

    // Write invalid items to file
    appendInvalidItemsToCSV([...chunk.invalidItems, ...checkResult]);

    // Write continuation token to file in order to resume the script
    writeContinuationToken(chunk.continuationToken);
  }
};

// execute the script
main().then(
  () => {
    logger.info("Script completed");
  },
  (err) => {
    logger.error(`Script failed with error ${err}`);
    process.exit(1);
  }
);
