import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import CIDRMatcher from "cidr-matcher";
import * as E from "fp-ts/lib/Either";
import { BackofficeInternalSubnetCIDR } from "../config";

export const AzureUserAttributesManageMiddlewareWrapper =
  (
    subscriptionCIDRsModel: SubscriptionCIDRsModel,
    { BACKOFFICE_INTERNAL_SUBNET_CIDR }: BackofficeInternalSubnetCIDR
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
    // If Request Ip is from the Backoffice Internal subnet, we don't need to check the user's attributes

    // extrat the ip from the request
    const clientIp = request.ip;

    // check if the ip is in the internal subnet by checking the cidr
    if (isIPInCIDR(clientIp, BACKOFFICE_INTERNAL_SUBNET_CIDR)) {
      return E.right({
        authorizedCIDRs: new Set(),
        email: "" as EmailAddress,
        kind: "IAzureUserAttributesManage",
      });
    }

    return await AzureUserAttributesManageMiddleware(subscriptionCIDRsModel)(
      request
    );
  };

const isIPInCIDR = (ip: string, cidr: string): boolean => {
  const matcher = new CIDRMatcher([cidr]);
  return matcher.contains(ip);
};
