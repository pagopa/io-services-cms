import { ApimUtils, SelfcareUtils } from "@io-services-cms/external-clients";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as pino from "pino";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const logger = pino({
  transport: {
    options: { colorize: true },
    target: "pino-pretty",
  },
});

const Config = t.type({
  AZURE_APIM: NonEmptyString,
  AZURE_APIM_PRODUCT_NAME: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
  SELFCARE_API_KEY: NonEmptyString,
  SELFCARE_EXTERNAL_API_BASE_URL: NonEmptyString,
});
type Config = t.TypeOf<typeof Config>;

const parseConfig = (): Config => {
  const result = Config.decode(process.env);
  if (E.isLeft(result)) {
    throw new Error(
      `Invalid environment configuration: ${readableReportSimplified(result.left)}`,
    );
  }
  return result.right;
};

const NOT_FOUND_STATUS = 404;

/**
 * Purge a single APIM user form institutionId:
 * - look up the APIM user by the institution's email
 * - delete the user and all the subscriptions related
 * 404 at any step is treated as "already purged", continue.
 */
const purgeUserFromInstId = (
  apimService: ApimUtils.ApimService,
  institutionId: string,
): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.bind("email", () =>
      TE.of(ApimUtils.formatEmailForOrganization(institutionId)),
    ),
    TE.bindW("maybeUser", ({ email }) =>
      pipe(
        apimService.getUserByEmail(email),
        TE.orElse((err) => {
          if ("statusCode" in err && err.statusCode === NOT_FOUND_STATUS) {
            logger.info(
              `APIM user for ${institutionId} not found (404), skipping`,
            );
            return TE.right(O.none);
          }
          return TE.left(new Error(JSON.stringify(err)));
        }),
      ),
    ),
    TE.chain(({ maybeUser }) => {
      if (O.isNone(maybeUser)) {
        logger.info(
          `No APIM user found for institution ${institutionId}, skipping`,
        );
        return TE.right(undefined);
      }
      const user = maybeUser.value;
      const userId = user.name;
      if (!userId) {
        logger.info(
          `APIM user for institution ${institutionId} has no name/id, skipping`,
        );
        return TE.right(undefined);
      }
      logger.info(`Deleting APIM user and subscriptions for: ${userId}`);
      return pipe(
        apimService.deleteUser(userId, "*", true),
        TE.orElse((err) => {
          if ("statusCode" in err && err.statusCode === NOT_FOUND_STATUS) {
            logger.info(`APIM user ${userId} already gone (404), continuing`);
            return TE.right(undefined);
          }
          return TE.left(
            new Error(`Failed deleting user ${userId}: ${JSON.stringify(err)}`),
          );
        }),
      );
    }),
  );

const PAGE_SIZE = 1000;

/**
 * Fetches all delegations for the given aggregatorInstitutionId via pagination.
 */
const fetchAllDelegations = async (
  selfcareClient: SelfcareUtils.SelfcareClient,
  aggregatorInstitutionId: string,
): Promise<
  SelfcareUtils.DelegationWithPaginationResponseStrict["delegations"]
> => {
  const allDelegations: SelfcareUtils.DelegationWithPaginationResponseStrict["delegations"][number][] =
    [];
  let page = 0;

  while (true) {
    logger.info(`Fetching delegations page ${page}...`);
    const result = await selfcareClient.getInstitutionDelegations(
      aggregatorInstitutionId,
      PAGE_SIZE,
      page++,
    )();

    if (E.isLeft(result)) {
      throw new Error(
        `Error fetching delegations page ${page}: ${result.left.message}`,
      );
    }

    const { delegations, pageInfo } = result.right;
    allDelegations.push(...delegations);

    logger.info(
      `Fetched ${delegations.length} delegations (page ${page}/${pageInfo.totalPages})`,
    );

    if (page >= pageInfo.totalPages) {
      break;
    }
  }

  return allDelegations;
};

const run = async (): Promise<void> => {
  const argv = await yargs(hideBin(process.argv))
    .option("aggregatorInstitutionId", {
      alias: "a",
      demandOption: true,
      describe: "The Selfcare institution ID of the aggregator",
      type: "string",
    })
    .option("purgeAggregator", {
      alias: "pa",
      default: false,
      describe: "If specified, also purge the aggregator",
      type: "boolean",
    })
    .strict()
    .help()
    .parse();

  const { aggregatorInstitutionId, purgeAggregator } = argv;

  logger.info(
    `Starting purge-all-aggregates for aggregator: ${aggregatorInstitutionId}
    Purge aggregator: ${purgeAggregator}`,
  );
  const startTime = Date.now();

  const config = parseConfig();

  const selfcareClient = SelfcareUtils.getSelfcareClient(
    config.SELFCARE_EXTERNAL_API_BASE_URL,
    config.SELFCARE_API_KEY,
    {},
  );

  const apimClient = ApimUtils.getApimClient(config.AZURE_SUBSCRIPTION_ID);
  const apimService = ApimUtils.getApimService(
    apimClient,
    config.AZURE_APIM_RESOURCE_GROUP,
    config.AZURE_APIM,
    config.AZURE_APIM_PRODUCT_NAME,
  );

  const delegations = await fetchAllDelegations(
    selfcareClient,
    aggregatorInstitutionId,
  );

  logger.info(`Total aggregates to purge: ${delegations.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (const delegation of delegations) {
    const { institutionId, institutionName } = delegation;
    logger.info(`Processing aggregate: ${institutionName} (${institutionId})`);

    const result = await purgeUserFromInstId(apimService, institutionId)();

    if (E.isLeft(result)) {
      logger.error(`ERROR purging ${institutionId}: ${result.left.message}`);
      errorCount++;
    } else {
      logger.info(`Done: ${institutionId}`);
      successCount++;
    }
  }

  if (purgeAggregator) {
    logger.info(`Processing aggregator: ${aggregatorInstitutionId}`);
    const result = await purgeUserFromInstId(
      apimService,
      aggregatorInstitutionId,
    )();

    if (E.isLeft(result)) {
      logger.error(
        `ERROR purging ${aggregatorInstitutionId}: ${result.left.message}`,
      );
      errorCount++;
    } else {
      logger.info(`Done: ${aggregatorInstitutionId}`);
      successCount++;
    }
  }

  logger.info(
    `Purge complete. Success: ${successCount}, Errors: ${errorCount} (${Date.now() - startTime}ms)`,
  );

  if (errorCount > 0) {
    logger.error(
      `${errorCount} aggregate(s) failed to purge. Re-run the script to retry (it is idempotent).`,
    );
    process.exit(1);
  }
};

run().catch((err) => {
  logger.error({ err }, "Unexpected error");
  process.exit(1);
});
