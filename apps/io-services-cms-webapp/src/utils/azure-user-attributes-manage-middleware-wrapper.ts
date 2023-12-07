import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import CIDRMatcher from "cidr-matcher";
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

    // If the middleware fails or the request comes outside the Backoffice subnet
    // return the originale middleware result
    if (
      E.isLeft(originalMiddelwareResult) ||
      !isIPInCIDR(request.ip, BACKOFFICE_INTERNAL_SUBNET_CIDRS)
    ) {
      // eslint-disable-next-line no-console
      console.log(
        "AzureUserAttributesManageMiddlewareWrapper| RETURNING ORIGINAL MIDDLEWARE RESULT | IP: ",
        request.ip,
        " | Allowed CIDRs: ",
        BACKOFFICE_INTERNAL_SUBNET_CIDRS,
        " | isIPInCIDR: ",
        isIPInCIDR(request.ip, BACKOFFICE_INTERNAL_SUBNET_CIDRS),
        " | E.isLeft(originalMiddelwareResult): ",
        E.isLeft(originalMiddelwareResult)
      );
      return originalMiddelwareResult;
    }

    // Otherwise, return the original middleware result with an empty list of CIDRs
    // This will skip all Authorized CIDRs checks

    // eslint-disable-next-line no-console
    console.log(
      "AzureUserAttributesManageMiddlewareWrapper| RETURNING EMPTY CIDRs | IP: ",
      request.ip,
      " | Allowed CIDRs: ",
      BACKOFFICE_INTERNAL_SUBNET_CIDRS,
      " | isIPInCIDR: ",
      isIPInCIDR(request.ip, BACKOFFICE_INTERNAL_SUBNET_CIDRS),
      " | E.isLeft(originalMiddelwareResult): ",
      E.isLeft(originalMiddelwareResult)
    );
    return E.right({
      ...originalMiddelwareResult.right,
      authorizedCIDRs: new Set(),
    });
  };

const isIPInCIDR = (ip: string, cidr: ReadonlyArray<string>): boolean => {
  const matcher = new CIDRMatcher(cidr);
  return matcher.contains(ip);
};
