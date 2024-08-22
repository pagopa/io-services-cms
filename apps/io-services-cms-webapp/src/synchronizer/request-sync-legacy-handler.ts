import { Context } from "@azure/functions";
import { Queue } from "@io-services-cms/models";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { QueuePermanentError } from "../utils/errors";
import { parseIncomingMessage } from "../utils/queue-utils";

export const handleQueueItem = (
  _context: Context,
  queueItem: Json,
  legacyServiceModel: ServiceModel
) =>
  pipe(
    queueItem,
    parseIncomingMessage(Queue.RequestSyncLegacyItem),
    TE.fromEither,
    TE.chainW((item) =>
      pipe(
        legacyServiceModel.findLastVersionByModelId([item.serviceId]),
        TE.chainW(
          O.fold(
            () =>
              pipe(
                { kind: "INewService" as const, ...item },
                (x) => {
                  _context.log.info(`create param:", ${JSON.stringify(x)}`);
                  return x;
                },
                (x) =>
                  legacyServiceModel.create({
                    ...x,
                    authorizedCIDRs:
                      x.authorizedCIDRs.size === 0
                        ? (new Set(["0.0.0.0/0"]) as Set<CIDR>)
                        : x.authorizedCIDRs,
                    isVisible: x.isVisible ?? false,
                  })
              ),
            (existingService) =>
              pipe(
                {
                  ...existingService,
                  ...{
                    ...item,
                    authorizedCIDRs:
                      item.authorizedCIDRs.size === 0
                        ? (new Set(["0.0.0.0/0"]) as Set<CIDR>)
                        : item.authorizedCIDRs,
                  },
                },
                (x) => {
                  _context.log.info(`update param: ${JSON.stringify(x)}`);
                  return x;
                },
                (x) => legacyServiceModel.update(x)
              )
          )
        ),
        TE.map((_) => void 0)
      )
    ),
    TE.getOrElseW((e) => {
      if (e instanceof QueuePermanentError) {
        _context.log.error(`Permanent error: ${e.message}`);
        return TE.right(void 0);
      } else if (e instanceof Error) {
        _context.log.error(
          `An Error has occurred while persisting data, the reason was => ${e.message}`,
          e
        );
        throw e;
      } else {
        _context.log.error(
          `An ${
            e.kind
          } has occurred while persisting data, the reason was => ${JSON.stringify(
            e
          )}`,
          e
        );
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
