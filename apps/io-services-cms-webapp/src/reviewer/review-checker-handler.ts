import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
import { sequenceT } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { JiraIssue } from "../lib/clients/jira-client";
import { JiraProxy } from "../utils/jira-proxy";
import {
  ServiceReviewDao,
  ServiceReviewRowDataTable,
} from "../utils/service-review-dao";

export type ProcessedJiraIssue = JiraIssue & {
  fields: JiraIssue["fields"] & {
    status: JiraIssue["fields"]["status"] & { name: "APPROVED" | "REJECTED" };
  };
};

export type IssueItemPair = {
  issue: ProcessedJiraIssue;
  item: ServiceReviewRowDataTable;
};

const makeServiceLifecycleApply = (
  serviceReview: ServiceReviewRowDataTable,
  jiraIssue: ProcessedJiraIssue
) => {
  switch (jiraIssue.fields.status.name) {
    case "REJECTED":
      return pipe(
        {
          reason: jiraIssue.fields.comment.comments
            .map((value) => value.body)
            .join("|"),
        },
        (data) =>
          ServiceLifecycle.apply("reject", serviceReview.service_id, data),
        RTE.map((_) => void 0)
      );
    case "APPROVED":
      return pipe(
        {
          approvalDate: jiraIssue.fields.statuscategorychangedate,
        },
        (data) =>
          ServiceLifecycle.apply("approve", serviceReview.service_id, data),
        RTE.map((_) => void 0)
      );
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = jiraIssue.fields.status.name;
      throw new Error("It should not happen");
  }
};

export const createReviewCheckerHandler =
  (
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    store: FSMStore<ServiceLifecycle.ItemType>
  ) =>
  (): Promise<unknown> =>
    dao.executeOnPending(processBatchOfReviews(dao, jiraProxy, store))();

/**
 * Build an array of Issue/Item pairs
 * @param jiraProxy
 * @returns
 */
export const buildIssueItemPairs =
  (jiraProxy: JiraProxy) => (items: ServiceReviewRowDataTable[]) =>
    pipe(
      // from pending items to their relative jira issues
      jiraProxy.searchJiraIssuesByKey(items.map((item) => item.ticket_key)),
      TE.map((jiraResponse) => jiraResponse.issues),

      // from all jira issues, to the processed issues only
      TE.map((issues) =>
        issues.filter(
          (issue): issue is ProcessedJiraIssue =>
            issue.fields.status.name === "APPROVED" ||
            issue.fields.status.name === "REJECTED"
        )
      ),
      // consider only the issues associated with a pending review
      // is it needed? searchJiraIssuesByKey should not give issues unrelate to pending reviews
      TE.map((issues) =>
        issues
          // associate each issue with its pending review
          .map((issue) => ({
            issue,
            item: items.find((item) => item.ticket_id === issue.id),
          }))
          // be sure the pending review is not undefined
          .filter((_): _ is IssueItemPair => typeof _.item !== "undefined")
      )
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
  (dao: ServiceReviewDao, store: FSMStore<ServiceLifecycle.ItemType>) =>
  (data: TE.TaskEither<Error, IssueItemPair[]>) =>
    pipe(
      data,
      TE.map((issuesAndItems) =>
        issuesAndItems.map(({ issue, item }) =>
          sequenceT(TE.ApplicativeSeq)(
            pipe(
              makeServiceLifecycleApply(item, issue)(store),
              TE.orElse((fsmError) => {
                switch (fsmError.kind) {
                  case "FsmNoTransitionMatchedError":
                  case "FsmTooManyTransitionsError":
                    // eslint-disable-next-line no-console
                    console.warn(fsmError.message); // FIXME: is it correct to log via console?
                    return TE.right(void 0);
                  default:
                    // eslint-disable-next-line no-console
                    console.error(fsmError.message); // FIXME: is it correct to log via console?
                    return pipe(fsmError, E.toError, TE.left);
                }
              })
            ),
            pipe(
              dao.updateStatus({
                ...item,
                status: issue.fields.status.name,
              }),
              TE.mapLeft((err) => {
                // eslint-disable-next-line no-console
                console.error(err.message); // FIXME: is it correct to log via console?
                return E.toError(err);
              })
            )
          )
        )
      ),
      // execute each sub-procedure in parallel
      TE.chain(RA.sequence(TE.ApplicativePar)),
      // we don't need data as result, just return void
      TE.map((_) => void 0)
    );

export const processBatchOfReviews =
  (
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    store: FSMStore<ServiceLifecycle.ItemType>
  ) =>
  (items: ServiceReviewRowDataTable[]) =>
    pipe(items, buildIssueItemPairs(jiraProxy), updateReview(dao, store));
