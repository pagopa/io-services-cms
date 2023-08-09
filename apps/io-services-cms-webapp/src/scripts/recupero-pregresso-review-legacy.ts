/* eslint-disable functional/immutable-data */
/* eslint-disable no-console */
/* eslint-disable functional/no-let */
import { Queue } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as AzureStorage from "azure-storage";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "../config";
import { getApimClient, getSubscription } from "../lib/clients/apim-client";
import {
  JiraLegacyIssue,
  jiraLegacyClient,
} from "../lib/clients/jira-legacy-client";

const SERVICE_ID_PREFIX = "devportal-service-";

const args = process.argv.slice(2);

const onlyLog = args.includes("-O");
const onlyFirstChunck = args.includes("-T");
const processParallel = args.includes("-P");
const delayQueue = args.includes("-DQ");

const config = getConfigOrThrow();
const jClient = jiraLegacyClient(config);
const apimClient = getApimClient(config, config.AZURE_SUBSCRIPTION_ID);
const azureStorageService = AzureStorage.createQueueService(
  config.INTERNAL_STORAGE_CONNECTION_STRING
);

// ##########################
// ### PROCEDURE HANDLERS ###
// ##########################
const start = async () => {
  const startTime = performance.now();
  let startAt = 0;
  let maxResults = 1;
  const messages: unknown[] = [];

  console.log(
    `PAST RECOVERY PROCEDURE STARTING..., onlyLog: ${onlyLog}, onlyFirstChunck, ${onlyFirstChunck}`
  );

  while (startAt < maxResults) {
    const response = await jClient.searchJiraNewReviewRejectedIssuesPaginated(
      startAt
    )();

    if (E.isLeft(response)) {
      throw response.left;
    }

    const issues = response.right.issues;

    for (const issue of issues) {
      // extract serviceId
      const serviceId = extractServiceId(issue);

      if (O.isNone(serviceId)) {
        console.error(`Issue ${issue.key} has no serviceId label, ERROR...`);
        throw new Error(`Issue ${issue.key} has no serviceId label, ERROR...`);
      }

      // retrieve apimUserId calling apim
      const apimUserId = await retrieveApimUserId(serviceId.value)();

      if (E.isLeft(apimUserId)) {
        console.error(`Issue ${issue.key} has no apimUserId, ERROR...`);
        throw new Error(`Issue ${issue.key} has no apimUserId, ERROR...`);
      }

      // build message and push it into messages array
      messages.push(
        buildQueueMessage(issue, serviceId.value, apimUserId.right)
      );
    }

    console.log(
      `PAST RECOVERY [PARALLEL] PROCEDURE CHUNK JIRA PROCESSED ${
        startAt + 100
      }/${response.right.total} WITH SUCCES`
    );

    maxResults = onlyFirstChunck ? 0 : response.right.total;
    startAt += 100;
  }

  console.log(
    `PAST RECOVERY PROCEDURE ALL JIRA ITEM RETRIEVED ${messages.length} TICKETS...`
  );

  // write on queue
  if (!onlyLog) {
    console.log(
      `PAST RECOVERY PROCEDURE WRITING ${messages.length} MESSAGES ON QUEUE...`
    );

    const queueFunction = delayQueue
      ? insertMassiveMessagesWithDelay(messages)
      : insertMassiveMessages(messages);

    await queueFunction;
    console.log(
      `PAST RECOVERY PROCEDURE WROTE ${messages.length} MESSAGES ON QUEUE SUCCESFULLY`
    );
  }

  const endTime = performance.now();
  const timeElapsed = endTime - startTime;

  console.log(
    `PAST RECOVERY PROCEDURE DONE WITH SUCCES in ${timeElapsed} milliseconds (~${(
      timeElapsed / 60000
    ).toFixed(
      2
    )} minutes) startAt: ${startAt}, maxResults: ${maxResults}, PROCESSED ELEMENTS ${
      messages.length
    }`
  );
};

const startParallel = async () => {
  const startTime = performance.now();
  let startAt = 0;
  let maxResults = 1;
  let messages: Queue.RequestReviewLegacyItem[] = [];

  console.log(
    `PAST RECOVERY [PARALLEL] PROCEDURE STARTING..., onlyLog: ${onlyLog}, onlyFirstChunck, ${onlyFirstChunck}`
  );

  while (startAt < maxResults) {
    const response = await jClient.searchJiraNewReviewRejectedIssuesPaginated(
      startAt
    )();

    if (E.isLeft(response)) {
      throw response.left;
    }

    const issues = response.right.issues;

    const processed = await processItems(issues)();

    if (E.isLeft(processed)) {
      throw processed.left;
    }

    messages = [...messages, ...processed.right];

    console.log(
      `PAST RECOVERY [PARALLEL] PROCEDURE CHUNK JIRA PROCESSED ${
        startAt + 100
      }/${response.right.total} WITH SUCCES`
    );

    maxResults = onlyFirstChunck ? 0 : response.right.total;
    startAt += 100;
  }

  console.log(
    `PAST RECOVERY PROCEDURE ALL JIRA ITEM RETRIEVED ${messages.length} TICKETS...`
  );

  // write on queue
  if (!onlyLog) {
    console.log(
      `PAST RECOVERY [PARALLEL] PROCEDURE WRITING ${messages.length} MESSAGES ON QUEUE...`
    );

    const queueFunction = delayQueue
      ? insertMassiveMessagesWithDelay(messages)
      : insertMassiveMessages(messages);

    await queueFunction;

    console.log(
      `PAST RECOVERY [PARALLEL] PROCEDURE WROTE ${messages.length} MESSAGES ON QUEUE SUCCESFULLY`
    );
  }

  const endTime = performance.now();
  const timeElapsed = endTime - startTime;

  console.log(
    `PAST RECOVERY [PARALLEL] PROCEDURE DONE WITH SUCCES in ${timeElapsed} milliseconds (~${(
      timeElapsed / 60000
    ).toFixed(
      2
    )} minutes) startAt: ${startAt}, maxResults: ${maxResults}, PROCESSED ELEMENTS ${
      messages.length
    }`
  );
};

// ################################
// ### ITEMS PROCESSING METHODS ###
// ################################

const processIssue = (
  issue: JiraLegacyIssue
): TE.TaskEither<Error, Queue.RequestReviewLegacyItem> =>
  pipe(
    extractServiceId(issue),
    O.fold(
      () =>
        TE.left(
          new Error(`Issue ${issue.key} has no serviceId label, ERROR...`)
        ),
      (serviceId) =>
        pipe(
          retrieveApimUserId(serviceId),
          TE.chain((apimUserId) =>
            TE.right(buildQueueMessage(issue, serviceId, apimUserId))
          )
        )
    )
  );

const processItems = (
  issues: ReadonlyArray<JiraLegacyIssue>
): TE.TaskEither<Error, ReadonlyArray<Queue.RequestReviewLegacyItem>> =>
  pipe(issues, RA.map(processIssue), (issueTasks) =>
    TE.sequenceArray(issueTasks)
  );

const extractServiceId = (issue: JiraLegacyIssue): O.Option<NonEmptyString> =>
  pipe(
    issue.fields.labels,
    O.fromNullable,
    O.chain(
      flow(
        RA.findFirst((label) => label.startsWith(SERVICE_ID_PREFIX)),
        O.map(
          (label) => label.substring(SERVICE_ID_PREFIX.length) as NonEmptyString
        )
      )
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

// #############################
// ### QUEUE MESSAGE METHODS ###
// #############################

const encodeToBase64 = (content: unknown): string => {
  const jsonString = JSON.stringify(content);
  const buffer = Buffer.from(jsonString, "utf-8");
  return buffer.toString("base64");
};

const insertQueueMessageAsync = (content: unknown): Promise<void> =>
  new Promise((resolve, reject) => {
    azureStorageService.createMessage(
      config.REQUEST_REVIEW_LEGACY_QUEUE,
      encodeToBase64(content),
      (error) => {
        if (error) {
          console.error(
            `An Error has occurred while writing message on queue: ${
              config.REQUEST_REVIEW_LEGACY_QUEUE
            }, content: ${encodeToBase64(content)}, the cause was: ${
              error.message
            }`
          );
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });

const insertMassiveMessages = async (contents: unknown[]): Promise<void> => {
  const promises = contents.map((content) => insertQueueMessageAsync(content));

  try {
    await Promise.all(promises);
    console.log("All messages inserted!");
  } catch (error) {
    console.error("Error inserting some messages:", error);
  }
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const insertMassiveMessagesWithDelay = async (
  contents: unknown[],
  delayTime: number = 25
): Promise<void> => {
  for (let i = 0; i < contents.length; i++) {
    try {
      await insertQueueMessageAsync(contents[i]);

      // Logga un messaggio ogni 100 inserimenti
      if ((i + 1) % 100 === 0) {
        console.log(
          `PAST RECOVERY ${
            processParallel ? "[PARALLEL]" : ""
          } PROCEDURE INSERTED ${i + 1}/${contents.length} MESSAGES IN QUEUE.`
        );
      }

      await delay(delayTime);
    } catch (error) {
      console.error(
        `PAST RECOVERY ${
          processParallel ? "[PARALLEL]" : ""
        } PROCEDURE ERROR INSERTING ELEMENT IN QUEUE: ${JSON.stringify(
          contents[i]
        )}`,
        contents[i],
        error
      );
      // Potresti voler salvare il messaggio in un sistema di logging avanzato qui
    }
  }
};

// #############################
// ### ENTRY POINT PROCEDURE ###
// #############################
const promise = processParallel ? startParallel() : start();

promise
  .then(() => {
    console.log(
      `PAST RECOVERY PROCEDURE SUCCESSFULLY FINISH, onlyLog: ${onlyLog}, onlyFirstChunck, ${onlyFirstChunck}, processParallel: ${processParallel}`
    );
  })
  .catch((error) => {
    console.error(
      `PAST RECOVERY PROCEDURE END UP IN ERRROR, the reason WAS: ${error.stack}`
    );
  });
