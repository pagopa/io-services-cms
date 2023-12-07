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
    // If Request Ip is from the Backoffice Internal subnet, we don't need to check the user's manage key authorized CIDRs

    // extract the ip from the request
    const clientIp = request.ip;

    // check if the request ip is in the backoffice internal subnet
    if (isIPInCIDR(clientIp, BACKOFFICE_INTERNAL_SUBNET_CIDRS)) {
      // in this case we returns an empty list of authorized CIDRs, so we will skip the check
      return E.right({
        authorizedCIDRs: new Set(),
        email: "" as EmailAddress,
        kind: "IAzureUserAttributesManage",
      });
    }

    // when he request comes from outside the backoffice subnet, we need to check the user's manage key authorized CIDRs and so we have to retrieve it
    return await AzureUserAttributesManageMiddleware(subscriptionCIDRsModel)(
      request
    );
  };

const isIPInCIDR = (ip: string, cidr: ReadonlyArray<string>): boolean => {
  const matcher = new CIDRMatcher(cidr);
  return matcher.contains(ip);
};
