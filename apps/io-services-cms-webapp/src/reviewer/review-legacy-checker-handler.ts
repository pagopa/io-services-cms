import { Context } from "@azure/functions";
import { ServiceLifecycle } from "@io-services-cms/models";
import { sequenceT } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { JiraIssue } from "../lib/clients/jira-client";
import { JiraProxy } from "../utils/jira-proxy";
import { getLogger } from "../utils/logger";
import {
  ServiceReviewDao,
  ServiceReviewRowDataTable,
} from "../utils/service-review-dao";

const logPrefix = "ServiceReviewLegacyChecker";

const JiraLegacyIssueStatusIdMap: Record<string, string> = {
  10279: "APPROVED",
  10280: "REJECTED",
};

export interface IssueItemPair {
  issue: JiraIssue;
  item: ServiceReviewRowDataTable;
}

export const processBatchOfReviews =
  (
    context: Context,
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
  ) =>
  (items: ServiceReviewRowDataTable[]) =>
    pipe(
      items,
      buildIssueItemPairs(jiraProxy),
      TE.chain(updateReview(dao, fsmLifecycleClient, context)),
    );

/**
 * Build an array of Issue/Item pairs
 * @param jiraProxy
 * @returns
 */
export const buildIssueItemPairs =
  (jiraProxy: JiraProxy) => (items: ServiceReviewRowDataTable[]) =>
    pipe(
      // from pending items to their relative jira issues
      jiraProxy.searchJiraIssuesByKeyAndStatus(
        items.map((item) => item.ticket_key),
        ["APPROVED", "REJECTED", "DONE", "Completata"],
      ),
      TE.map((jiraResponse) => jiraResponse.issues),
      // consider only the issues associated with a pending review
      // is it needed? searchJiraIssuesByKey should not give issues unrelate to pending reviews
      TE.map((issues) => {
        const itemsMap = new Map(items.map((i) => [i.ticket_id, i]));
        return (
          issues
            // associate each issue with its pending review
            .map((issue) => ({
              issue,
              item: itemsMap.get(issue.id),
            }))
            // be sure the pending review is not undefined
            .filter((_): _ is IssueItemPair => typeof _.item !== "undefined")
        );
      }),
    );

/**
 * For each pair, compose a sub-procedure of actions to be executed one after another
 * first we want to apply the transition to the service
 * then we update the pending review status.
 * @param dao
 * @param store
 * @returns
 */
export const updateReview =
  (
    dao: ServiceReviewDao,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    context: Context,
  ) =>
  (issueItemPairs: IssueItemPair[]): TE.TaskEither<Error, void> => {
    const logger = getLogger(context, logPrefix, "updateReview");
    return pipe(
      issueItemPairs,
      RA.traverse(TE.ApplicativePar)(({ issue, item }) =>
        sequenceT(TE.ApplicativeSeq)(
          makeServiceLifecycleApply(context)(item, issue, fsmLifecycleClient),
          pipe(
            dao.updateStatus({
              ...item,
              status: decodeLegacyJiraIssueStatus(issue),
            }),
            TE.mapLeft((err) => {
              logger.logError(err, "Error updating legacy review status on DB");
              return E.toError(err);
            }),
          ),
        ),
      ),
      TE.map((_) => void 0),
    );
  };

const makeServiceLifecycleApply =
  (context: Context) =>
  (
    serviceReview: ServiceReviewRowDataTable,
    jiraIssue: JiraIssue,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
  ) => {
    const logger = getLogger(context, logPrefix, "makeServiceLifecycleApply");
    return pipe(
      serviceReview.service_id,
      fsmLifecycleClient.fetch,
      TE.chain(
        flow(
          O.fold(
            () =>
              TE.left(
                new Error(
                  `Service ${serviceReview.service_id} not found cannot ovverride after legacy review`,
                ),
              ),
            flow(
              O.fromPredicate((service) => service.fsm.state !== "deleted"),
              O.fold(
                () => {
                  logger.log(
                    "warn",
                    `Service ${serviceReview.service_id} is deleted, skipping it`,
                  );
                  return TE.right(void 0);
                },
                flow(
                  buildUpdatedServiceLifecycleItem(jiraIssue),
                  (updateService) =>
                    fsmLifecycleClient.override(
                      updateService.id,
                      updateService,
                    ),
                  TE.map((_) => void 0),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  };

const buildUpdatedServiceLifecycleItem =
  (jiraIssue: JiraIssue) =>
  (service: ServiceLifecycle.ItemType): ServiceLifecycle.ItemType => {
    const issueStatus = decodeLegacyJiraIssueStatus(jiraIssue);

    return issueStatus === "APPROVED"
      ? {
          ...service,
          fsm: {
            ...service.fsm,
            approvalDate: jiraIssue.fields.statuscategorychangedate,
            state: "approved",
          },
        }
      : {
          ...service,
          fsm: {
            ...service.fsm,
            reason:
              jiraIssue.fields.comment.comments.length > 0
                ? jiraIssue.fields.comment.comments[
                    jiraIssue.fields.comment.comments.length - 1
                  ].body
                : "",
            state: "rejected",
          },
        };
  };

const decodeLegacyJiraIssueStatus = (
  issue: JiraIssue,
): "APPROVED" | "REJECTED" => {
  // Trying Decoding using the status id
  const decondedStatus =
    JiraLegacyIssueStatusIdMap[issue.fields.status.id ?? ""];

  if (decondedStatus) {
    return decondedStatus === "APPROVED" ? "APPROVED" : "REJECTED";
  }

  // Trying Decoding using the status id
  if (
    ["APPROVATO", "APPROVED", "COMPLETATA"].includes(
      issue.fields.status.name.toUpperCase(),
    )
  ) {
    return "APPROVED";
  } else if (
    ["REJECTED", "RIFIUTATO"].includes(issue.fields.status.name.toUpperCase())
  ) {
    return "REJECTED";
  }

  throw new Error("Unable to decode Jira Legacy Issue Status");
};

export const createReviewLegacyCheckerHandler =
  (
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
  ) =>
  (context: Context): Promise<unknown> =>
    dao.executeOnPending(
      processBatchOfReviews(context, dao, jiraProxy, fsmLifecycleClient),
    )();
