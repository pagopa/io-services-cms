import { Context } from "@azure/functions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Service } from "io-services-cms-models/service-lifecycle/types";
import * as t from "io-ts";
import { Json, JsonFromString } from "io-ts-types";
import { ApimProxy } from "../utils/apim-proxy";
import { ServiceReviewDao } from "../utils/service-review-dao";
import { ServiceReviewProxy } from "../utils/service_review_proxy";

/**
 * Trace an incoming error and return it. To be added in a pipeline for not interrupt the flow.
 *
 * @param context the context of the Azure function
 * @param label defines the error family and meaning
 * @returns an error
 */
export const logError =
  (context: Context, label: string) =>
  (reason: string | Error): Error => {
    const err =
      reason instanceof Error ? reason : new Error(`${label}|${reason}`);
    context.log.error(
      `${context.executionContext.functionName}|${err.message}`
    );
    return err;
  };

/**
 * Wrap a function handler so that every input is a valid JSON object
 * Useful to normalize input coming from queueTrigger, which could be bot a parsed object or a stringified object
 *
 * @param handler the handler to be executed
 * @param logPrefix
 * @returns
 */
export const withJsonInput =
  (
    handler: (
      context: Context,
      ...parsedInputs: ReadonlyArray<Json>
    ) => Promise<unknown>
  ) =>
  (context: Context, ...inputs: ReadonlyArray<unknown>): Promise<unknown> =>
    pipe(
      inputs,
      RA.map((input) =>
        pipe(
          input,
          t.string.decode,
          E.chain(JsonFromString.decode),
          E.fold((_) => Json.decode(input), E.of)
        )
      ),
      RA.sequence(E.Applicative),
      E.mapLeft(
        flow(
          readableReport,
          logError(context, "Cannot parse incoming queue item into JSON object")
        )
      ),
      E.getOrElseW((err) => {
        throw err;
      }),
      (parsedInputs) => handler(context, ...parsedInputs)
    );

const parseIncomingMessage = (queueItem: Json): E.Either<Error, Service> =>
  pipe(
    queueItem,
    Service.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const handleRequestReview = ({
  dao,
  jiraProxy,
  apimProxy,
}: {
  readonly dao: ServiceReviewDao;
  readonly jiraProxy: ServiceReviewProxy;
  readonly apimProxy: ApimProxy;
}): ReturnType<typeof withJsonInput> =>
  withJsonInput((_context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      // search ticket by serviceId
      TE.chain((service) =>
        pipe(
          apimProxy.getDelegateFromServiceId(service.id),
          TE.mapLeft(E.toError),
          // TE.map((delegate) => ({ service, delegate }))
          TE.chain((delegate) =>
            pipe(
              jiraProxy.createJiraIssue(service, delegate),
              TE.mapLeft(E.toError),
              TE.chain((ticket) =>
                pipe(
                  dao.insert({
                    service_id: service.id,
                    service_version: service.id,
                    ticket_id: ticket.key,
                    status: "PENDING",
                    extra_data: "d" as NonEmptyString,
                  }),
                  TE.mapLeft(E.toError)
                )
              )
            )
          )
        )
      ),
      // TE.chain(item => pipe(jiraProxy.createJiraIssue(item.service, item.delegate),TE.mapLeft(E.toError)))
      (x) => x
    )()
  );
