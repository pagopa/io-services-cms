import { Context } from "@azure/functions";
import { Queue } from "@io-services-cms/models";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestSyncLegacyItem> =>
  pipe(
    queueItem,
    Queue.RequestSyncLegacyItem.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

export const handleQueueItem = (
  _context: Context,
  queueItem: Json,
  legacyServiceModel: ServiceModel
) =>
  pipe(
    queueItem,
    (x) => {
      _context.log.info("before parse:", x);
      return x;
    },
    parseIncomingMessage,
    E.mapLeft((_) => {
      _context.log.error(_);
      return new Error("Error while parsing incoming message");
    }), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.chainW((item) =>
      pipe(
        legacyServiceModel.findOneByServiceId(item.serviceId),
        TE.chainW(
          O.fold(
            () =>
              pipe(
                { kind: "INewService" as const, ...item },
                (x) => {
                  _context.log.info("create param:", x);
                  return x;
                },
                legacyServiceModel.create
              ),
            (existingService) =>
              pipe(
                { ...existingService, ...item },
                (x) => {
                  _context.log.info("update param:", x);
                  return x;
                },
                legacyServiceModel.update
              )
          )
        ),
        (x) => x,
        TE.map((_) => void 0)
      )
    ),
    TE.getOrElse((e) => {
      if (e instanceof Error) {
        throw e;
      } else {
        switch (e.kind) {
          case "COSMOS_EMPTY_RESPONSE":
          case "COSMOS_CONFLICT_RESPONSE":
            throw new Error(e.kind);
          case "COSMOS_DECODING_ERROR":
            throw E.toError(e.error);
          case "COSMOS_ERROR_RESPONSE":
            throw E.toError(e.error.message);
          default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = e;
            throw new Error(`should not have executed this with ${e}`);
        }
      }
    })
  );

export const createRequestSyncLegacyHandler = (
  legacyServiceModel: ServiceModel
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, legacyServiceModel)()
  );
