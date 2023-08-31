import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { IConfig } from "../config";
import { withJsonInput } from "../lib/azure/misc";
import { CreateJiraIssueResponse } from "../lib/clients/jira-client";
import { ApimProxy } from "../utils/apim-proxy";
import { isUserAllowedForAutomaticApproval } from "../utils/feature-flag-handler";
import { JiraProxy } from "../utils/jira-proxy";
import { ServiceReviewDao } from "../utils/service-review-dao";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestReviewItem> =>
  pipe(
    queueItem,
    Queue.RequestReviewItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

const createJiraTicket =
  (apimProxy: ApimProxy, jiraProxy: JiraProxy) =>
  (
    service: Queue.RequestReviewItem
  ): TE.TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      service.id,
      apimProxy.getDelegateFromServiceId,
      TE.mapLeft(E.toError),
      TE.chain((delegate) =>
        pipe(
          jiraProxy.createJiraIssue(service, delegate),
          TE.mapLeft(E.toError)
        )
      )
    );

const saveTicketReference =
  (dao: ServiceReviewDao, service: Queue.RequestReviewItem) =>
  (ticket: CreateJiraIssueResponse) =>
    pipe(
      dao.insert({
        service_id: service.id,
        service_version: service.version,
        ticket_id: ticket.id,
        ticket_key: ticket.key,
        status: "PENDING",
        extra_data: {},
      }),
      TE.mapLeft(E.toError)
    );

const approveService =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (service: Queue.RequestReviewItem): TE.TaskEither<Error, void> =>
    pipe(
      fsmLifecycleClient.approve(service.id, {
        approvalDate: new Date().toISOString() as NonEmptyString,
      }),
      TE.map((_) => void 0)
    );

const sendServiceToReview =
  (dao: ServiceReviewDao, jiraProxy: JiraProxy, apimProxy: ApimProxy) =>
  (service: Queue.RequestReviewItem): TE.TaskEither<Error, void> =>
    pipe(
      service.id,
      jiraProxy.getPendingJiraIssueByServiceId,
      TE.chain(
        flow(
          O.fold(
            () => createJiraTicket(apimProxy, jiraProxy)(service),
            TE.right
          )
        )
      ),
      TE.chain(saveTicketReference(dao, service)),
      TE.map((_) => void 0)
    );

export const createRequestReviewHandler = (
  dao: ServiceReviewDao,
  jiraProxy: JiraProxy,
  apimProxy: ApimProxy,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  apimClient: ApiManagementClient,
  config: IConfig
): ReturnType<typeof withJsonInput> =>
  withJsonInput((_context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.chain((service) =>
        pipe(
          isUserAllowedForAutomaticApproval(config, apimClient, service.id),
          TE.chain(
            B.fold(
              () => sendServiceToReview(dao, jiraProxy, apimProxy)(service),
              () => approveService(fsmLifecycleClient)(service)
            )
          )
        )
      ),
      TE.getOrElse((e) => {
        throw e;
      })
    )()
  );
