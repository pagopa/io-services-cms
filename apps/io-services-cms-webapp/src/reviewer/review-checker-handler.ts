/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { ServiceLifecycle } from "@io-services-cms/models";
import { sequenceT } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as B from "fp-ts/lib/boolean";
import { pipe } from "fp-ts/lib/function";
import { JiraIssue } from "../lib/clients/jira-client";
import { JiraProxy } from "../utils/jira-proxy";
import { getLogger } from "../utils/logger";
import {
  ServiceReviewDao,
  ServiceReviewRowDataTable,
} from "../utils/service-review-dao";

export type IssueItemPair = {
  issue: JiraIssue;
  item: ServiceReviewRowDataTable;
};

const logPrefix = "ReviewerCheckerHandler";

const JiraIssueStatusIdMap: Record<string, string> = {
  10985: "APPROVED",
  10986: "REJECTED",
};

const makeServiceLifecycleApply = (
  serviceReview: ServiceReviewRowDataTable,
  jiraIssue: JiraIssue,
  fsmLifecycleClient: ServiceLifecycle.FsmClient
) => {
  const jiraIssueStatus = decodeJiraIssueStatus(jiraIssue);
  switch (jiraIssueStatus) {
    case "REJECTED":
      return pipe(
        {
          reason: jiraIssue.fields.comment.comments
            .map((value) => value.body)
            .join("|"),
        },
        (data) => fsmLifecycleClient.reject(serviceReview.service_id, data),
        TE.map((_) => void 0)
      );
    case "APPROVED":
      return pipe(
        {
          approvalDate: jiraIssue.fields.statuscategorychangedate,
        },
        (data) => fsmLifecycleClient.approve(serviceReview.service_id, data),
        TE.map((_) => void 0)
      );
    default:
      throw new Error("It should not happen");
  }
};

export const createReviewCheckerHandler =
  (
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    fsmLifecycleClient: ServiceLifecycle.FsmClient
  ) =>
  async (context: Context): Promise<unknown> => {
    const logger = getLogger(context, logPrefix, "createReviewCheckerHandler");
    return await pipe(
      processBatchOfReviews(context, dao, jiraProxy, fsmLifecycleClient),
      dao.executeOnPending,
      TE.getOrElse((err) => {
        logger.logError(
          err,
          "An error occurred while processing the batch of reviews"
        );
        throw err;
      })
    )();
  };

/**
 * Build an array of Issue/Item pairs
 * @param jiraProxy
 * @returns
 */
export const buildIssueItemPairs =
  (context: Context, jiraProxy: JiraProxy) =>
  (items: ServiceReviewRowDataTable[]) => {
    const logger = getLogger(context, logPrefix, "buildIssueItemPairs");
    return pipe(
      // from pending items to their relative jira issues
      jiraProxy.searchJiraIssuesByKeyAndStatus(
        items.map((item) => item.ticket_key),
        ["APPROVED", "REJECTED"]
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
      TE.mapLeft((err) => {
        logger.logError(err, "An error occurred while building IssueItemPairs");
        return err;
      })
    );
  };

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
    context: Context,
    dao: ServiceReviewDao,
    fsmLifecycleClient: ServiceLifecycle.FsmClient
  ) =>
  (issueItemPairs: IssueItemPair[]): TE.TaskEither<Error, void> => {
    const logger = getLogger(context, logPrefix, "updateReview");
    return pipe(
      issueItemPairs,
      RA.traverse(TE.ApplicativePar)(({ issue, item }) =>
        sequenceT(TE.ApplicativeSeq)(
          pipe(
            makeServiceLifecycleApply(item, issue, fsmLifecycleClient),
            TE.orElse((fsmError) =>
              pipe(
                fsmError.kind === "FsmNoTransitionMatchedError",
                B.fold(
                  () => {
                    logger.logError(
                      fsmError,
                      `An ${fsmError.kind} has occurred`
                    );
                    return pipe(fsmError, E.toError, TE.left);
                  },
                  () => {
                    logger.log(
                      "warn",
                      `${fsmError.message} - skipping service having id ${item.service_id}`
                    );
                    return TE.right(void 0);
                  }
                )
              )
            )
          ),
          pipe(
            dao.updateStatus({
              ...item,
              status: decodeJiraIssueStatus(issue),
            }),
            TE.mapLeft((err) => {
              logger.logError(
                err,
                "An error occurred while updating the status"
              );
              return E.toError(err);
            })
          )
        )
      ),
      // we don't need data as result, just return void
      TE.map((_) => void 0)
    );
  };

const decodeJiraIssueStatus = (issue: JiraIssue): "APPROVED" | "REJECTED" => {
  // Trying Decoding using the status id
  const decondedStatus = JiraIssueStatusIdMap[issue.fields.status.id ?? ""];

  if (decondedStatus) {
    return decondedStatus === "APPROVED" ? "APPROVED" : "REJECTED";
  }

  // Trying Decoding using the status id
  if (
    ["APPROVATO", "APPROVED"].includes(issue.fields.status.name.toUpperCase())
  ) {
    return "APPROVED";
  } else if (
    ["RIFIUTATO", "REJECTED"].includes(issue.fields.status.name.toUpperCase())
  ) {
    return "REJECTED";
  }

  throw new Error("Unable to decode Jira Issue Status");
};

export const processBatchOfReviews =
  (
    context: Context,
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    fsmLifecycleClient: ServiceLifecycle.FsmClient
  ) =>
  (items: ServiceReviewRowDataTable[]) =>
    pipe(
      items,
      buildIssueItemPairs(context, jiraProxy),
      TE.chain(updateReview(context, dao, fsmLifecycleClient)),
      TE.mapLeft((err) => {
        getLogger(context, logPrefix, "processBatchOfReviews").logError(
          err,
          "An error occurred processing the batch of reviews"
        );
        return err;
      })
    );
