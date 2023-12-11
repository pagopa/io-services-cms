import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import { BackofficeInternalSubnetCIDRs } from "../config";

export const AzureUserAttributesManageMiddlewareWrapper =
  (
    subscriptionCIDRsModel: SubscriptionCIDRsModel,
    { BACKOFFICE_INTERNAL_SUBNET_CIDRS }: BackofficeInternalSubnetCIDRs
  ): IRequestMiddleware<
    | "IResponseErrorForbiddenNotAuthorized"
    | "IResponseErrorQuery"
    | "IResponseErrorInternal",
    IAzureUserAttributesManage
  > =>
  async (
    request
  ): Promise<
    E.Either<
      IResponse<
        | "IResponseErrorForbiddenNotAuthorized"
        | "IResponseErrorQuery"
        | "IResponseErrorInternal"
      >,
      IAzureUserAttributesManage
    >
  > => {
    // Execute the AzureUserAttributesManageMiddleware
    const originalMiddelwareResult = await AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel
    )(request);

    // eslint-disable-next-line no-console
    console.log(
      "AzureUserAttributesManageMiddlewareWrapper | IP: ",
      request.ip,
      " | headers.forwarded: ",
      request.headers.forwarded,
      " | X-Forwarded-For: ",
      request.header("X-Forwarded-For")
    );

    // If the middleware fails or the request comes outside the Backoffice subnet
    // return the originale middleware result
    if (
      E.isLeft(originalMiddelwareResult) ||
      originalMiddelwareResult.right.authorizedCIDRs.size === 0
    ) {
      return originalMiddelwareResult;
    }

    // Otherwise, return the original middleware result with an empty list of CIDRs
    // This will skip all Authorized CIDRs checks

    return E.right({
      ...originalMiddelwareResult.right,
      authorizedCIDRs: new Set([
        ...originalMiddelwareResult.right.authorizedCIDRs,
        ...BACKOFFICE_INTERNAL_SUBNET_CIDRS,
      ]),
    });
  };
