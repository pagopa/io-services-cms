import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND
} from "@/config/constants";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { BackOfficeUser } from "../../../../types/next-auth";
import { ResponseContent, buildResponseContent } from "./response-utils";

export const retrieveManageKeyCIDRs = (
  subscriptionCIDRsModel: SubscriptionCIDRsModel
) => (
  backOfficeUser: BackOfficeUser
): T.Task<ResponseContent<ResponseError> | ResponseContent<ManageKeyCIDRs>> =>
  pipe(
    subscriptionCIDRsModel.findLastVersionByModelId([
      backOfficeUser.parameters.subscriptionId as NonEmptyString
    ]),
    TE.mapLeft(error =>
      buildResponseContent(
        ResponseError.encode({
          title: "ManageKeyCIDRsError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          detail: JSON.stringify(error)
        }),
        HTTP_STATUS_INTERNAL_SERVER_ERROR
      )
    ),
    TE.chainW(
      TE.fromOption(() =>
        buildResponseContent(
          ResponseError.encode({
            title: "ManageKeyCIDRsNotFound",
            status: HTTP_STATUS_NOT_FOUND as any,
            detail: "Manage Key CIDRs not found"
          }),
          HTTP_STATUS_NOT_FOUND
        )
      )
    ),
    TE.map(response =>
      buildResponseContent(
        ManageKeyCIDRs.encode({
          cidrs: Array.from(response.cidrs.values())
        })
      )
    ),
    TE.toUnion
  );
