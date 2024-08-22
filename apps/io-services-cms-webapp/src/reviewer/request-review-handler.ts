import { ApimUtils } from "@io-services-cms/external-clients";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { IConfig } from "../config";
import { withJsonInput } from "../lib/azure/misc";
import { CreateJiraIssueResponse, JiraIssue } from "../lib/clients/jira-client";
import { PermanentError } from "../utils/errors";
import { isUserAllowedForAutomaticApproval } from "../utils/feature-flag-handler";
import { JiraProxy } from "../utils/jira-proxy";
import { ServiceReviewDao } from "../utils/service-review-dao";

const jiraIssuesStatusRejectedId = "10986";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<PermanentError, Queue.RequestReviewItem> =>
  pipe(
    queueItem,
    Queue.RequestReviewItem.decode,
    E.mapLeft(
      flow(
        readableReport,
        (_) => new PermanentError(`Error parsing incoming message: ${_}`)
      )
    )
  );

const createJiraTicket =
  (apimService: ApimUtils.ApimService, jiraProxy: JiraProxy) =>
  (
    service: Queue.RequestReviewItem,
    firstPublication: boolean
  ): TE.TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      service.id,
      apimService.getDelegateFromServiceId,
      TE.mapLeft(E.toError),
      TE.chain((delegate) =>
        pipe(
          jiraProxy.createJiraIssue(service, delegate, firstPublication),
          TE.mapLeft(E.toError)
        )
      )
    );

const updateExistingJiraTicket =
  (apimService: ApimUtils.ApimService, jiraProxy: JiraProxy) =>
  (
    service: Queue.RequestReviewItem,
    existingTicket: JiraIssue,
    firstPublication: boolean
  ): TE.TaskEither<Error, CreateJiraIssueResponse> =>
    pipe(
      service.id,
      apimService.getDelegateFromServiceId,
      TE.chainW((delegate) =>
        pipe(
          jiraProxy.updateJiraIssue(
            existingTicket.key,
            service,
            delegate,
            firstPublication
          ),
          TE.chain((_) => jiraProxy.reOpenJiraIssue(existingTicket.key)),
          TE.map((_) => ({
            id: existingTicket.id,
            key: existingTicket.key,
          }))
        )
      ),
      TE.mapLeft(E.toError)
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
      TE.map((_) => void 0),
      TE.orElseW((e) =>
        pipe(
          // Check if the error is due to a unique constraint violation
          // If so, we can ignore it, cause it means that the ticket reference is already present in the db
          !!e.constraint,
          B.fold(
            () => TE.left(E.toError(e)),
            () => TE.right(void 0)
          )
        )
      )
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

const processExistingJiraTicket =
  (
    apimService: ApimUtils.ApimService,
    jiraProxy: JiraProxy,
    service: Queue.RequestReviewItem,
    firstPublication: boolean
  ) =>
  (existingTicket: JiraIssue) =>
    pipe(
      jiraIssuesStatusRejectedId === existingTicket.fields.status.id,
      B.foldW(
        () => TE.right(existingTicket), // Ticket is not rejected, so we can use it as is
        () =>
          // Ticket is rejected, so we need to reopen it and update it
          pipe(
            updateExistingJiraTicket(apimService, jiraProxy)(
              service,
              existingTicket,
              firstPublication
            )
          )
      )
    );

const sendServiceToReview =
  (
    dao: ServiceReviewDao,
    jiraProxy: JiraProxy,
    apimService: ApimUtils.ApimService,
    fsmPublicationClient: ServicePublication.FsmClient
  ) =>
  (service: Queue.RequestReviewItem): TE.TaskEither<Error, void> =>
    pipe(
      service.id,
      jiraProxy.getPendingAndRejectedJiraIssueByServiceId, // Check if there is already a ticket for this service
      TE.bindTo("existingTicket"),
      TE.bind("firstPublication", () =>
        isFirstServicePublication(fsmPublicationClient)(service.id)
      ),
      TE.chain(({ existingTicket, firstPublication }) =>
        pipe(
          existingTicket,
          O.fold(
            () =>
              createJiraTicket(apimService, jiraProxy)(
                service,
                firstPublication
              ), // No ticket found, so we can create a new one
            processExistingJiraTicket(
              apimService,
              jiraProxy,
              service,
              firstPublication
            ) // Ticket found, so we need to reopen it and update it
          )
        )
      ),
      TE.chain(saveTicketReference(dao, service)) // save ticketReference in db
    );

const isFirstServicePublication =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (serviceId: NonEmptyString): TE.TaskEither<Error, boolean> =>
    pipe(
      serviceId,
      fsmPublicationClient.getStore().fetch,
      TE.map(
        flow(
          O.fold(
            () => true,
            (_) => false
          )
        )
      )
    );

export const createRequestReviewHandler = (
  dao: ServiceReviewDao,
  jiraProxy: JiraProxy,
  apimService: ApimUtils.ApimService,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient,
  config: IConfig
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.chainW((service) =>
        pipe(
          isUserAllowedForAutomaticApproval(config, apimService, service.id),
          TE.chain(
            B.fold(
              () =>
                sendServiceToReview(
                  dao,
                  jiraProxy,
                  apimService,
                  fsmPublicationClient
                )(service),
              () => approveService(fsmLifecycleClient)(service)
            )
          )
        )
      ),
      TE.getOrElseW((e) => {
        if (e instanceof PermanentError) {
          context.log.error(`Permanent error: ${e.message}`);
          return T.of(void 0);
        }
        throw e;
      })
    )()
  );
