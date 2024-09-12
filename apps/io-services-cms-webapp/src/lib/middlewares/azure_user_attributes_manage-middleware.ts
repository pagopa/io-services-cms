/*
 * A middleware that extracts custom user attributes from the request, that supports MANAGE flow.
 */
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { IAzureUserAttributes } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes";
import { ResponseErrorQuery } from "@pagopa/io-functions-commons/dist/src/utils/response";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import {
  IResponse,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import winston = require("winston");

// The user email will be passed in this header by the API Gateway
const HEADER_USER_EMAIL = "x-user-email";

const HEADER_USER_SUBSCRIPTION_KEY = "x-subscription-id";

/**
 * The attributes extracted from the user's "Note"
 */
export type IAzureUserAttributesManage = {
  // authorized source CIDRs
  readonly authorizedCIDRs: ReadonlySet<CIDR>;
  readonly kind: "IAzureUserAttributesManage";
} & Omit<IAzureUserAttributes, "kind" | "service">;

/**
 * A middleware that will extract custom user attributes from the request, that supports **MANAGE** flow.
 *
 * The middleware expects the following header:
 *
 * *x-subscription-id*: The user's subscription id.
 *
 * Used to check if its name starts with *'MANAGE-'*.
 *
 * On success, the middleware provides an *IAzureUserAttributesManage*.
 */
export const AzureUserAttributesManageMiddleware =
  (
    subscriptionCIDRsModel: SubscriptionCIDRsModel,
  ): IRequestMiddleware<
    | "IResponseErrorForbiddenNotAuthorized"
    | "IResponseErrorInternal"
    | "IResponseErrorQuery",
    IAzureUserAttributesManage
  > =>
  async (
    request,
  ): Promise<
    E.Either<
      IResponse<
        | "IResponseErrorForbiddenNotAuthorized"
        | "IResponseErrorInternal"
        | "IResponseErrorQuery"
      >,
      IAzureUserAttributesManage
    >
  > => {
    const errorOrUserEmail = EmailString.decode(
      request.header(HEADER_USER_EMAIL),
    );

    if (E.isLeft(errorOrUserEmail)) {
      return E.left<
        IResponse<"IResponseErrorInternal">,
        IAzureUserAttributesManage
      >(
        ResponseErrorInternal(
          `Missing, empty or invalid ${HEADER_USER_EMAIL} header`,
        ),
      );
    }

    const userEmail = errorOrUserEmail.right;

    const errorOrUserSubscriptionId = NonEmptyString.decode(
      request.header(HEADER_USER_SUBSCRIPTION_KEY),
    );

    if (E.isLeft(errorOrUserSubscriptionId)) {
      return E.left<
        IResponse<"IResponseErrorInternal">,
        IAzureUserAttributesManage
      >(
        ResponseErrorInternal(
          `Missing or empty ${HEADER_USER_SUBSCRIPTION_KEY} header`,
        ),
      );
    }

    const subscriptionId = errorOrUserSubscriptionId.right;

    if (subscriptionId.startsWith("MANAGE-")) {
      // MANAGE Flow
      const errorOrMaybeAuthorizedCIDRs =
        await subscriptionCIDRsModel.findLastVersionByModelId([
          subscriptionId,
        ])();

      if (E.isLeft(errorOrMaybeAuthorizedCIDRs)) {
        winston.error(
          `No CIDRs found for subscription|${subscriptionId}|${JSON.stringify(
            errorOrMaybeAuthorizedCIDRs.left,
          )}`,
        );
        return E.left<
          IResponse<"IResponseErrorQuery">,
          IAzureUserAttributesManage
        >(
          ResponseErrorQuery(
            `Error while retrieving CIDRs tied to the provided subscription id`,
            errorOrMaybeAuthorizedCIDRs.left,
          ),
        );
      }

      const maybeAuthorizedCIDRs = errorOrMaybeAuthorizedCIDRs.right;

      const authInfo: IAzureUserAttributesManage = {
        authorizedCIDRs: pipe(
          maybeAuthorizedCIDRs,
          O.map((authorizedCIDRs) => authorizedCIDRs.cidrs),
          O.getOrElse<ReadonlySet<CIDR>>(() => new Set<CIDR>()),
        ),
        email: userEmail,
        kind: "IAzureUserAttributesManage",
      };

      return E.right<
        IResponse<
          "IResponseErrorForbiddenNotAuthorized" | "IResponseErrorInternal"
        >,
        IAzureUserAttributesManage
      >(authInfo);
    } else {
      return E.left<
        IResponse<"IResponseErrorForbiddenNotAuthorized">,
        IAzureUserAttributesManage
      >(ResponseErrorForbiddenNotAuthorized);
    }
  };
