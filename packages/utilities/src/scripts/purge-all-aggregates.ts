/* eslint-disable no-console */
import { SubscriptionContract } from "@azure/arm-apimanagement";
import { ApimUtils, SelfcareUtils } from "@io-services-cms/external-clients";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
 * Delete all subscriptions for a given APIM user.
 * 404 on any individual subscription is treated as "already deleted" and ignored.
 */
const deleteAllSubscriptionsForUser = (
  apimService: ApimUtils.ApimService,
  userId: string,
): TE.TaskEither<Error, void> =>
  pipe(
    apimService.getUserSubscriptions(userId),
    TE.orElse((err) => {
      if ("statusCode" in err && err.statusCode === NOT_FOUND_STATUS) {
        console.log(
          `Subscriptions for user ${userId} not found (404), skipping`,
        );
        return TE.right([] as readonly SubscriptionContract[]);
      }
      return TE.left(new Error(err.name || "APIM RestError"));
    }),
    TE.chain(
      flow(
        ROA.map((subscription) => {
          const subcriptionId = subscription.name;
          if (!subcriptionId) {
            return TE.right(undefined);
          }
          console.log(`Deleting subscription: ${subcriptionId}`);
          return pipe(
            apimService.deleteSubscription(subcriptionId),
            TE.orElse((err) => {
              if ("statusCode" in err && err.statusCode === NOT_FOUND_STATUS) {
                console.log(
                  `Subscription ${subcriptionId} already gone (404), continuing`,
                );
                return TE.right(undefined);
              }
              return TE.left(
                err instanceof Error
                  ? err
                  : new Error(err.name || "APIM RestError"),
              );
            }),
          );
        }),
        ROA.sequence(TE.ApplicativeSeq),
      ),
    ),
    TE.map((_) => void 0),
  );

/**
 * Purge a single aggregate institution from APIM:
 * - look up the APIM user by the institution's email
 * - delete all their subscriptions
 * - delete the user
 * 404 at any step is treated as "already purged", continue.
 */
const purgeAggregate = (
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
            console.log(
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
        console.log(
          `No APIM user found for institution ${institutionId}, skipping`,
        );
        return TE.right(undefined);
      }
      const user = maybeUser.value;
      const userId = user.name;
      if (!userId) {
        console.warn(
          `APIM user for institution ${institutionId} has no name/id, skipping`,
        );
        return TE.right(undefined);
      }
      console.log(`APIM user: ${userId}`);
      return pipe(
        deleteAllSubscriptionsForUser(apimService, userId),
        TE.orElse((err) =>
          TE.left(
            new Error(
              `Failed deleting subscriptions for user ${userId}: ${JSON.stringify(err)}`,
            ),
          ),
        ),
        TE.chainW(() => {
          console.log(`Deleting APIM user: ${userId}`);
          return pipe(
            apimService.deleteUser(userId),
            TE.orElse((err) => {
              if ("statusCode" in err && err.statusCode === NOT_FOUND_STATUS) {
                console.log(
                  `APIM user ${userId} already gone (404), continuing`,
                );
                return TE.right(undefined);
              }
              return TE.left(
                new Error(
                  `Failed deleting user ${userId}: ${JSON.stringify(err)}`,
                ),
              );
            }),
          );
        }),
      );
    }),
  );

const PAGE_SIZE = 100;

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
    console.log(`Fetching delegations page ${page}...`);
    const result = await selfcareClient.getInstitutionDelegations(
      aggregatorInstitutionId,
      PAGE_SIZE,
      page,
    )();

    if (E.isLeft(result)) {
      throw new Error(
        `Error fetching delegations page ${page}: ${result.left.message}`,
      );
    }

    const { delegations, pageInfo } = result.right;
    allDelegations.push(...delegations);

    console.log(
      `Fetched ${delegations.length} delegations (page ${page}/${pageInfo.totalPages})`,
    );

    if (page >= pageInfo.totalPages) {
      break;
    }
    page++;
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
    .strict()
    .help()
    .parse();

  const { aggregatorInstitutionId } = argv;

  console.log(
    `Starting purge-all-aggregates for aggregator: ${aggregatorInstitutionId}`,
  );

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

  console.log(`\nTotal aggregates to purge: ${delegations.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const delegation of delegations) {
    const { institutionId, institutionName } = delegation;
    console.log(`Processing aggregate: ${institutionName} (${institutionId})`);

    const result = await purgeAggregate(apimService, institutionId)();

    if (E.isLeft(result)) {
      console.error(`ERROR purging ${institutionId}: ${result.left.message}`);
      errorCount++;
    } else {
      console.log(`Done: ${institutionId}`);
      successCount++;
    }
  }

  console.log(
    `\nPurge complete. Success: ${successCount}, Errors: ${errorCount}`,
  );

  if (errorCount > 0) {
    console.error(
      `\n${errorCount} aggregate(s) failed to purge. Re-run the script to retry (it is idempotent).`,
    );
    process.exit(1);
  }
};

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
