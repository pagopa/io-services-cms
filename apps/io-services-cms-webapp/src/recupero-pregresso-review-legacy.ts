/* eslint-disable no-console */
/* eslint-disable functional/no-let */
import * as E from "fp-ts/Either";
import { getConfigOrThrow } from "./config";
import {
  JiraLegacyIssue,
  jiraLegacyClient,
} from "./lib/clients/jira-legacy-client";
import { RequestReviewLegacyItem } from "@io-services-cms/models/queue";

const config = getConfigOrThrow();
const jClient = jiraLegacyClient(config);

const recupera = async () => {
  let startAt = 0;
  let maxResults = 1;
  let messages: unknown = [];

  while (startAt < maxResults) {
    const response = await jClient.searchJiraNewReviewRejectedIssuesPaginated(
      startAt
    )();

    if (E.isLeft(response)) {
      throw response.left;
    }
    const issues = response.right.issues;

    issues.forEach((issue) => {
      // build message
      messages.add(buildQueueMessage(issue));
    });

    maxResults = response.right.total;
    startAt += 100;
  }
};
const buildQueueMessage = (issue: JiraLegacyIssue): RequestReviewLegacyItem => {
  return {
    isNewTicket: true,
    serviceId: extractServiceId(issue),
    ticketId: NonEmptyString,
    ticketKey: NonEmptyString,
    apimUserId: NonEmptyString,
  };
};

recupera()
  .then((risultato) => {
    console.log(risultato); // Stampa: Promise risolta!
  })
  .catch((errore) => {
    console.error("Si è verificato un errore:", errore);
  });
