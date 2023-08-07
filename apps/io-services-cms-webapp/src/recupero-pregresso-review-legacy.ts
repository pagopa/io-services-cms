/* eslint-disable functional/immutable-data */
/* eslint-disable no-console */
/* eslint-disable functional/no-let */
import { Queue } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "./config";
import { getApimClient, getSubscription } from "./lib/clients/apim-client";
import {
  JiraLegacyIssue,
  jiraLegacyClient,
} from "./lib/clients/jira-legacy-client";

const SERVICE_ID_PREFIX = "devportal-service-";

const config = getConfigOrThrow();
const jClient = jiraLegacyClient(config);
const apimClient = getApimClient(config, config.AZURE_SUBSCRIPTION_ID);

const start = async () => {
  let startAt = 0;
  let maxResults = 1;
  const messages: unknown[] = [];

  console.log(`PAST RECOVERY PROCEDURE STARTING...`);

  while (startAt < maxResults) {
    const response = await jClient.searchJiraNewReviewRejectedIssuesPaginated(
      startAt
    )();

    console.log(
      `PAST RECOVERY PROCEDURE CHUNK JIRA RETRIEVED WITH startAt: ${startAt}, maxResults: ${maxResults}`
    );

    if (E.isLeft(response)) {
      throw response.left;
    }

    const issues = response.right.issues;

    issues.forEach(async (issue) => {
      // extract serviceId
      const serviceId = extractServiceId(issue);

      if (O.isNone(serviceId)) {
        console.log(`Issue ${issue.key} has no serviceId label, ERROR...`);
        throw new Error(`Issue ${issue.key} has no serviceId label, ERROR...`);
      }

      // retrieve apimUserId calling apim
      const apimUserId = await retrieveApimUserId(serviceId.value)();

      if (E.isLeft(apimUserId)) {
        console.log(`Issue ${issue.key} has no apimUserId, ERROR...`);
        throw new Error(`Issue ${issue.key} has no apimUserId, ERROR...`);
      }

      // build message and push it into messages array
      messages.push(
        buildQueueMessage(issue, serviceId.value, apimUserId.right)
      );
    });

    console.log(
      `PAST RECOVERY PROCEDURE CHUNK JIRA PROCESSED WITH SUCCES startAt: ${startAt}, maxResults: ${maxResults}`
    );

    maxResults = response.right.total;
    startAt += 100;
  }

  console.log(
    `PAST RECOVERY PROCEDURE ALL JIRA ITEM RETIEVED... startAt: ${startAt}, maxResults: ${maxResults}, RETRIEVED ${messages.length} TICKETS...`
  );

  // write on queue
};

const extractServiceId = (issue: JiraLegacyIssue): O.Option<NonEmptyString> =>
  pipe(
    issue.labels,
    RA.findFirst((label) => label.startsWith(SERVICE_ID_PREFIX)),
    O.map(
      (label) => label.substring(SERVICE_ID_PREFIX.length) as NonEmptyString
    )
  );

const retrieveApimUserId = (
  serviceId: NonEmptyString
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    getSubscription(
      apimClient,
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM,
      serviceId
    ),
    TE.mapLeft(
      (_) =>
        new Error(
          `An error has occurred while retrieving service '${serviceId}'`
        )
    ),
    TE.map(({ ownerId }) => ownerId as NonEmptyString)
  );

const buildQueueMessage = (
  issue: JiraLegacyIssue,
  serviceId: NonEmptyString,
  apimUserId: NonEmptyString
): Queue.RequestReviewLegacyItem => ({
  isNewTicket: true,
  serviceId,
  ticketId: issue.id,
  ticketKey: issue.key,
  apimUserId,
});

start()
  .then(() => {
    console.log(`PAST RECOVERY PROCEDURE SUCCESSFULLY FINISH`);
  })
  .catch((error) => {
    console.error(
      `PAST RECOVERY PROCEDURE END UP IN ERRROR, the reason WAS: ${error}`
    );
  });
