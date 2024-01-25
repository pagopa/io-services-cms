/* eslint-disable functional/immutable-data */
/* eslint-disable no-console */
/* eslint-disable functional/no-let */
import { ServicePublication, stores } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import * as fs from "fs";
import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types";
import nodeFetch from "node-fetch-commonjs";
import os from "os";

import { getConfigOrThrow } from "../config";
import { getDatabase } from "../lib/azure/cosmos";
import {
  JIRA_REST_API_PATH,
  SearchJiraIssuesPayload,
} from "../lib/clients/jira-client";

const args = process.argv.slice(2);
const onlyLog = args.includes("-O");
const onlyFirstChunck = args.includes("-T");

const config = getConfigOrThrow();

// client to interact with cms db
const cosmos = getDatabase(config);
const servicePublicationStore = stores.createCosmosStore(
  cosmos.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
  ServicePublication.ItemType
);

const jiraHeaders = {
  Accept: "application/json",
  Authorization: `Basic ${Buffer.from(
    `${config.JIRA_USERNAME}:${config.JIRA_TOKEN}`
  ).toString("base64")}`,
  "Content-Type": "application/json",
};
const tresholdDate = new Date("2024-01-10T17:00:00.000+0100");
const TRANSITION_ID_REVIEW = "2" as NonEmptyString;
const TRANSITION_ID_APPROVE = "5" as NonEmptyString;
const OUTPUT_CSV_FILE_PATH = `${os.homedir()}/approve_ticket/${new Date().getTime()}_results.csv`;

interface CsvElement {
  serviceId: string;
  ticketId: string;
  ticketKey: string;
  updateDate: string;
  processResult: ProcessResult;
}

type ProcessDetails = {
  skipped: number;
  approved: number;
  error: number;
};

type ProcessResult =
  | "SKIPPED_THREESHOLD"
  | "SKIPPED_PUBLICATION"
  | "APPROVED"
  | "SIMULATE_APPROVED"
  | "ERROR_REVIEW"
  | "ERROR_APPROVE"
  | "ERROR";

// ##########################
// ### PROCEDURE HANDLERS ###
// ##########################
const start = async () => {
  const startTime = performance.now();
  let startAt = 0;
  let maxResults = 100;

  let processDetails: ProcessDetails = {
    skipped: 0,
    approved: 0,
    error: 0,
  };

  lazyCreateCsvFile();

  console.log(
    `[APPROVE TICKET PROCEDURE] STARTING..., onlyLog: ${onlyLog}, onlyFirstChunck, ${onlyFirstChunck}`
  );

  while (startAt < maxResults) {
    const response = await searchJiraIssues({
      fields: ["id", "summary", "updated", "created"],
      fieldsByKeys: false,
      maxResults: 100,
      startAt,
      jql: "project = IEST AND issuetype = Task AND status in (New) ORDER BY updated ASC",
    })();

    if (E.isLeft(response)) {
      throw response.left;
    }

    const chunckprocessDetails = await processTickets(response.right, onlyLog);

    processDetails.approved += chunckprocessDetails.approved;
    processDetails.error += chunckprocessDetails.error;
    processDetails.skipped += chunckprocessDetails.skipped;

    console.log(
      `[APPROVE TICKET PROCEDURE] CHUNK JIRA PROCESSED ${startAt + 100}/${
        response.right.total
      }`
    );

    maxResults = onlyFirstChunck ? 0 : response.right.total;
    startAt += 100;
  }

  const endTime = performance.now();
  const timeElapsed = endTime - startTime;

  console.log(
    `[APPROVE TICKET PROCEDURE] FINISHED in ${timeElapsed} milliseconds (~${(
      timeElapsed / 60000
    ).toFixed(
      2
    )} minutes) startAt: ${startAt}, maxResults: ${maxResults}, APPROVED: ${
      processDetails.approved
    }, SKIPPED: ${processDetails.skipped}
    , ERROR: ${processDetails.error}`
  );
};

const processTickets = async (
  resp: JiraIssuesResponse,
  onlyLog: boolean
): Promise<ProcessDetails> => {
  let processDetails: ProcessDetails = {
    skipped: 0,
    approved: 0,
    error: 0,
  };

  for (const issue of resp.issues) {
    // extract service
    const serviceId = extractServiceId(issue);

    //Process
    const processResult = await processTicket(serviceId, issue, onlyLog);

    if (
      processResult === "SKIPPED_THREESHOLD" ||
      processResult === "SKIPPED_PUBLICATION"
    ) {
      console.log(
        `[APPROVE TICKET PROCEDURE] Ticket ${issue.key} related to service ${serviceId} => ${processResult}`
      );
      processDetails.skipped++;
    } else if (
      processResult === "APPROVED" ||
      processResult === "SIMULATE_APPROVED"
    ) {
      console.log(
        `[APPROVE TICKET PROCEDURE] Ticket ${issue.key} related to service ${serviceId} => ${processResult}`
      );
      processDetails.approved++;
    } else {
      processDetails.error++;
    }

    // Write Result to CSV
    appendItemsToCSV({
      serviceId,
      ticketId: issue.id,
      ticketKey: issue.key,
      updateDate: issue.fields.updated.toISOString(),
      processResult,
    });
  }

  return processDetails;
};

const processTicket = async (
  serviceId: NonEmptyString,
  issue: JiraIssueCst,
  onlyLog: boolean
): Promise<ProcessResult> => {
  try {
    if (issue.fields.updated > tresholdDate) {
      return "SKIPPED_THREESHOLD";
    }

    // retirieve publicationStatus
    const publicationStatus = await retrievePublicationStatus(serviceId)();

    // Skipping cause is not published
    if (publicationStatus !== "published") {
      return "SKIPPED_PUBLICATION";
    }

    if (onlyLog) {
      return "SIMULATE_APPROVED";
    }

    // Transition Ticket to Review
    const reviewTransitionResult = await applyJiraIssueTransition(
      issue.key,
      TRANSITION_ID_REVIEW
    )();

    if (E.isLeft(reviewTransitionResult)) {
      console.error(
        `!!! ERROR [APPROVE TICKET PROCEDURE] Ticket ${issue.key} related to service ${serviceId} => ERROR_REVIEW cause: `,
        reviewTransitionResult.left
      );
      return "ERROR_REVIEW";
    }

    // Transition Ticket to Approved
    const approveTransitionResult = await applyJiraIssueTransition(
      issue.key,
      TRANSITION_ID_APPROVE
    )();

    if (E.isLeft(approveTransitionResult)) {
      console.error(
        `!!! ERROR [APPROVE TICKET PROCEDURE] Ticket ${issue.key} related to service ${serviceId} => ERROR_APPROVE cause: `,
        approveTransitionResult.left
      );
      return "ERROR_APPROVE";
    }

    return "APPROVED";
  } catch (e) {
    console.error(
      `!!! ERROR [APPROVE TICKET PROCEDURE] Ticket ${issue.key} related to service ${serviceId} => UNMANAGED_ERROR cause: `,
      e
    );
    return "ERROR";
  }
};

const retrievePublicationStatus = (serviceId: NonEmptyString) =>
  pipe(
    serviceId,
    servicePublicationStore.fetch,
    TE.chainW(
      O.fold(
        () => TE.right("never published"),
        (p) => TE.right(p.fsm.state)
      )
    ),
    TE.getOrElse((e) => {
      throw e;
    })
  );

const extractServiceId = (issue: JiraIssueCst): NonEmptyString =>
  pipe(
    issue.fields.summary.match(/#(.*)/),
    O.fromNullable,
    O.fold(
      () => "ServiceId not found in summary" as NonEmptyString,
      (x) => (x.length > 1 ? x[1] : "not found") as NonEmptyString
    )
  );

const lazyCreateCsvFile = () => {
  if (!fs.existsSync(OUTPUT_CSV_FILE_PATH)) {
    // File does not exist, init it by appending the CSV header
    fs.appendFileSync(
      OUTPUT_CSV_FILE_PATH,
      "serviceId;ticketId;ticketKey;updateDate;processResult\n"
    );
  }
};
const appendItemsToCSV = (csvElement: CsvElement) => {
  const csvLine = `${csvElement.serviceId};${csvElement.ticketId};${csvElement.ticketKey};${csvElement.updateDate};${csvElement.processResult}`;
  fs.appendFileSync(OUTPUT_CSV_FILE_PATH, csvLine + "\n");
};

// #############################
// ####### JIRA API CALL #######
// #############################

const searchJiraIssues = (
  bodyData: SearchJiraIssuesPayload,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): TE.TaskEither<Error, JiraIssuesResponse> =>
  pipe(
    TE.tryCatch(
      () =>
        fetchApi(`${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}search`, {
          body: JSON.stringify(bodyData),
          headers: jiraHeaders,
          method: "POST",
        }),
      E.toError
    ),
    TE.chain(checkJiraResponse),
    TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
    TE.chain((responseBody) =>
      pipe(
        responseBody,
        JiraIssuesResponse.decode,
        TE.fromEither,
        TE.mapLeft((errors) => E.toError(readableReport(errors)))
      )
    )
  );

const applyJiraIssueTransition = (
  ticketKey: NonEmptyString,
  transitionId: NonEmptyString,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () =>
        fetchApi(
          `${config.JIRA_NAMESPACE_URL}${JIRA_REST_API_PATH}issue/${ticketKey}/transitions`,
          {
            body: JSON.stringify({
              transition: {
                id: transitionId,
              },
            }),
            headers: jiraHeaders,
            method: "POST",
          }
        ),
      E.toError
    ),
    TE.chain(checkJiraResponse),
    TE.map((_) => void 0)
  );

export const JiraIssueCst = t.type({
  id: NonEmptyString,
  key: NonEmptyString,
  fields: t.type({
    summary: NonEmptyString,
    updated: DateFromISOString,
    created: DateFromISOString,
  }),
});
export type JiraIssueCst = t.TypeOf<typeof JiraIssueCst>;

export const JiraIssuesResponse = t.intersection([
  t.type({
    startAt: t.number,
    total: t.number,
    issues: t.readonlyArray(JiraIssueCst),
  }),
  t.partial({
    warningMessages: t.readonlyArray(t.string),
  }),
]);
export type JiraIssuesResponse = t.TypeOf<typeof JiraIssuesResponse>;

export const checkJiraResponse = (
  response: Response
): TE.TaskEither<Error, Response> => {
  if (
    response.status === 200 ||
    response.status === 201 ||
    response.status === 204
  ) {
    return TE.right(response);
  } else if (response.status === 400) {
    return TE.left(new Error("Invalid request"));
  } else if (response.status === 401) {
    return TE.left(new Error("Jira secrets misconfiguration"));
  } else if (response.status >= 500) {
    return pipe(
      TE.tryCatch(() => response.text(), E.toError),
      TE.mapLeft(
        (_) =>
          new Error(
            `Jira API returns an error, content => Cannot Extract Content`
          )
      ),
      TE.chainW((content) =>
        TE.left(new Error(`Jira API returns an error, content => ${content}`))
      )
    );
  } else {
    return TE.left(
      new Error(`Unknown status code ${response.status} received`)
    );
  }
};

// #############################
// ### ENTRY POINT PROCEDURE ###
// #############################

start()
  .then(() => {
    console.log(
      `[APPROVE TICKET PROCEDURE] SUCCESSFULLY FINISH, onlyLog: ${onlyLog}, onlyFirstChunck, ${onlyFirstChunck}`
    );
  })
  .catch((error) => {
    console.error(
      `[APPROVE TICKET PROCEDURE] END UP IN ERRROR, the reason WAS: `,
      error
    );
  });
