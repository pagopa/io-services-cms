/**
 * Script to check if the sync process is working properly.
 *
 * This script will:
 * 1. Retrieve all service from ServiceLifecycle collection
 * 2. For each service, map to legacy format usign the cmsToLegacy function from onHistoryChange
 * 3. Retrieve the last version of the corrispondig service from the legacy collection
 * 4. Compare the two services and log the result
 *
 * Run Script command: ts-node src/scripts/sync-checker-script.ts
 */
import fs from "fs";
import os from "os";
import { LegacyService } from "@io-services-cms/models";
import {
  SERVICE_COLLECTION_NAME,
  ServiceModel,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as AzureStorage from "azure-storage";
import * as RR from "fp-ts/ReadonlyRecord";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "../config";
import { getApimClient } from "../lib/clients/apim-client";
import { cosmosdbClient } from "../utils/cosmos-legacy";
import { handler as onLegacyServiceChangeHandler } from "../watchers/on-legacy-service-change";

/* eslint-disable no-console */
const logger = {
  info: (message: string) =>
    console.log(
      `[INFO][REIMPORT LAST VERSION PROCEDURE][${new Date().toISOString()}] => ${message}`
    ),
  error: (message: string) =>
    console.error(
      `[ERROR][REIMPORT LAST VERSION PROCEDURE][${new Date().toISOString()}] => ${message}`
    ),
};

// Deps
const config = getConfigOrThrow();

// legacyService Container instance
const legacyServicesContainer = cosmosdbClient
  .database(config.LEGACY_COSMOSDB_NAME)
  .container(SERVICE_COLLECTION_NAME);

const legacyServiceModel = new ServiceModel(legacyServicesContainer);

// client to interact with Api Management
const apimClient = getApimClient(config, config.AZURE_SUBSCRIPTION_ID);
const azureStorageService = AzureStorage.createQueueService(
  config.INTERNAL_STORAGE_CONNECTION_STRING
);
const RESULT_PATH = `${os.homedir()}/sync_check_result`;
const INVALID_ITEMS_CSV_FILE_PATH = `${RESULT_PATH}/invalid_items.csv`;
const CONTINUATION_TOKEN_FILE = `${RESULT_PATH}/continuation_token.txt`;

const bindEvents = () => {
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
    process.exit(1);
  });

  process.on("sigint", () => {
    logger.info("SIGINT received, exiting");
    process.exit(0);
  });
};

const openCSV = (): string => {
  if (fs.existsSync(INVALID_ITEMS_CSV_FILE_PATH)) {
    return fs.readFileSync(INVALID_ITEMS_CSV_FILE_PATH, "utf8").trim();
  }
  logger.error(
    `Starting from beginnging casue no file, ${CONTINUATION_TOKEN_FILE} was not present`
  );
  throw new Error("Invalid CSV file");
};

const encodeToBase64 = (content: unknown): string => {
  const jsonString = JSON.stringify(content);
  const buffer = Buffer.from(jsonString, "utf-8");
  return buffer.toString("base64");
};

const insertNewMessage = (content: unknown) => {
  azureStorageService.createMessage(
    config.REQUEST_SYNC_CMS_QUEUE,
    encodeToBase64(content),
    (error) => {
      if (error) {
        logger.error(
          `An Error has occurred while writing message on queue: ${config.REQUEST_SYNC_CMS_QUEUE}, content: ${content}, the cause was: ${error.message}`
        );
      }
    }
  );
};

const main = async () => {
  // eslint-disable-next-line functional/no-let
  let processedWithSuccess = 0;
  // eslint-disable-next-line functional/no-let
  let processedWithError = 0;
  // eslint-disable-next-line functional/no-let
  let skipped = 0;

  bindEvents();

  // Aprire CSV
  const invalidCsvContent = openCSV();

  const invalidRecords = invalidCsvContent.split("\n");

  // per ogni serviceId:
  // 1. retrieve legacy latest version
  // 2. chiamare funzione handler di handler

  for (const invalidRecord of invalidRecords) {
    const content = invalidRecord.split("|");
    const serviceId = content[0] as NonEmptyString;
    const processPhase = content[1];
    if (processPhase === "COMPARE") {
      logger.info(`Processing serviceId ${serviceId}`);
      await processItems(serviceId)().then(
        () => {
          processedWithSuccess++;
        },
        (err) => {
          logger.error(
            `Error while processing serviceId ${serviceId}, the reason was => ${err.message}, the stack was => ${err.stack}`
          );
          processedWithError++;
        }
      );
      logger.info(`PROCESSED serviceId ${serviceId}`);
    } else {
      skipped++;
    }
  }

  logger.info(
    `Script completed, totalItems: ${invalidRecords.length}, processedWithSuccess: ${processedWithSuccess}, processedWithError: ${processedWithError}, skipped: ${skipped}`
  );
};

const processItems = (serviceId: NonEmptyString) =>
  pipe(
    legacyServiceModel.findLastVersionByModelId([serviceId]),
    TE.chainW(
      TE.fromOption(() => new Error(`No service found having id ${serviceId}`))
    ),
    TE.chainW((legacyService) =>
      pipe(
        onLegacyServiceChangeHandler(
          config,
          apimClient,
          legacyServiceModel
        )({ item: legacyService as unknown as LegacyService }),
        TE.mapLeft(
          (e) =>
            new Error(
              `Error while processing serviceId ${serviceId}, the reason was => ${e.message}, the stack was => ${e.stack}`
            )
        )
      )
    ),
    TE.chainW(
      flow(
        RR.lookup("requestSyncCms"),
        TE.fromOption(() => new Error("No action returned"))
      )
    ),
    TE.map((queueMessage) => {
      insertNewMessage(queueMessage);
      return void 0;
    })
  );

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
