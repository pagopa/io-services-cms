import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { JiraProxy } from "../utils/jira-proxy";
import {
  ServiceReviewDao,
  ServiceReviewRowDataTable,
} from "../utils/service-review-dao";
import { JiraIssue } from "../lib/clients/jira-client";

const makeServiceLifecycleApply = (
  serviceReview: ServiceReviewRowDataTable,
  jiraIssue: JiraIssue
) => {
  if (jiraIssue.fields.status.name === "APPROVED") {
    return ServiceLifecycle.apply("approve", serviceReview.service_id, {
      // TODO: quale data?
      approvalDate: "",
    });
  }
  if (jiraIssue.fields.status.name === "REJECTED") {
    return ServiceLifecycle.apply("reject", serviceReview.service_id, {
      reason: jiraIssue.fields.comment.comments.join("|"),
    });
  }
};

export const createReviewCheckerHandler = (
  dao: ServiceReviewDao,
  jiraProxy: JiraProxy,
  store: FSMStore<ServiceLifecycle.ItemType>
): Promise<unknown> =>
  pipe(
    dao.executeOnPending((items) => {
      // eslint-disable-next-line no-console
      console.log("executeOnPending:", items);
      return pipe(
        jiraProxy.searchJiraIssuesByKey(items.map((item) => item.ticket_key)),
        TE.chain((jiraResponse) =>
          TE.of(
            jiraResponse.issues.forEach((issue) => {
              if (
                issue.fields.status.name === "APPROVED" ||
                issue.fields.status.name === "REJECTED"
              ) {
                const maybeServiceReview = O.fromNullable(
                  items.find((item) => item.ticket_id === issue.id)
                );
                if (O.isSome(maybeServiceReview)) {
                  const maybeRTEServiceLifacycle = O.fromNullable(
                    makeServiceLifecycleApply(maybeServiceReview.value, issue)
                  );
                  if (O.isSome(maybeRTEServiceLifacycle)) {
                    maybeRTEServiceLifacycle.value(store);
                  }
                  dao.insert({
                    ...maybeServiceReview.value,
                    status: issue.fields.status.name,
                  });
                }
              }
            })
          )
        )
      );
    })
  )();
