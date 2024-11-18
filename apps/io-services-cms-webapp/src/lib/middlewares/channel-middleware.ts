import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

const Channel = t.union([t.literal("APIM"), t.literal("BO")]);
type Channel = t.TypeOf<typeof Channel>;

/**
 * Extracts the channel from the provided header.
 * Block the request if the value is not valid
 *
 * @returns either the channel or an error
 */
export const ChannelMiddleware: IRequestMiddleware<
  "IResponseErrorInternal",
  Channel
> = async (request) =>
  pipe(
    request.header("x-channel"),
    E.fromPredicate(Channel.is, (_) =>
      ResponseErrorInternal(`Failed to decode provided channel`),
    ),
  );
