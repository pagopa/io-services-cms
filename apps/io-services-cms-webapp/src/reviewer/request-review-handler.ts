import { Service } from "@io-services-cms/models/service-lifecycle/types";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { ApimProxy } from "../utils/apim-proxy";
import { ServiceReviewDao } from "../utils/service-review-dao";
import { ServiceReviewProxy } from "../utils/service_review_proxy";

const parseIncomingMessage = (queueItem: Json): E.Either<Error, Service> =>
  pipe(
    queueItem,
    Service.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const createRequestReviewHandler = (
  dao: ServiceReviewDao,
  jiraProxy: ServiceReviewProxy,
  apimProxy: ApimProxy
): ReturnType<typeof withJsonInput> =>
  withJsonInput((_context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.chain((service) =>
        pipe(
          service.id,
          jiraProxy.getJiraIssueByServiceId,
          TE.chain(
            flow(
              O.fold(
                () =>
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
                  ),
                TE.right
              )
            )
          ),
          TE.chain((ticket) =>
            pipe(
              dao.insert({
                service_id: service.id,
                service_version: service.id,
                ticket_id: ticket.key,
                status: "PENDING",
                extra_data: {},
              }),
              TE.mapLeft(E.toError)
            )
          )
        )
      ),
      TE.getOrElse((e) => {
        throw e;
      })
    )()
  );
