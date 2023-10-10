import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND
} from "@/config/constants";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

export const retrieveManageKeyCIDRs = (
  subscriptionCIDRsModel: SubscriptionCIDRsModel
) => (backOfficeUser: BackOfficeUser) =>
  pipe(
    subscriptionCIDRsModel.findLastVersionByModelId([
      backOfficeUser.parameters.subscriptionId as NonEmptyString
    ]),
    TE.mapLeft(error =>
      NextResponse.json(
        {
          title: "ManageKeyRetrieveCIDRsError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          detail: JSON.stringify(error)
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      )
    ),
    TE.chainW(
      TE.fromOption(() =>
        NextResponse.json(
          {
            title: "ManageKeyRetrieveCIDRsNotFound",
            status: HTTP_STATUS_NOT_FOUND,
            detail: "Manage Key CIDRs not found"
          },
          { status: HTTP_STATUS_NOT_FOUND }
        )
      )
    ),
    TE.map(response =>
      NextResponse.json({
        cidrs: response.cidrs
      })
    ),
    TE.toUnion
  );

export const updateManageKeyCIDRs = (
  subscriptionCIDRsModel: SubscriptionCIDRsModel
) => (backOfficeUser: BackOfficeUser, nextRequest: NextRequest) =>
  pipe(
    TE.tryCatch(
      () => nextRequest.json(),
      _ =>
        NextResponse.json(
          {
            title: "ManageKeyUpdateCIDRsError",
            status: HTTP_STATUS_BAD_REQUEST,
            detail: "Bad request"
          },
          { status: HTTP_STATUS_BAD_REQUEST }
        )
    ),
    TE.chainW(
      flow(
        ManageKeyCIDRs.decode,
        E.mapLeft(error =>
          NextResponse.json(
            {
              title: "ManageKeyUpdateCIDRsError",
              status: HTTP_STATUS_BAD_REQUEST,
              detail: readableReport(error)
            },
            { status: HTTP_STATUS_BAD_REQUEST }
          )
        ),
        TE.fromEither
      )
    ),
    TE.chainW(bodyDecoded =>
      pipe(
        subscriptionCIDRsModel.upsert({
          cidrs: new Set(bodyDecoded.cidrs),
          kind: "INewSubscriptionCIDRs",
          subscriptionId: backOfficeUser.parameters
            .subscriptionId as NonEmptyString
        }),
        TE.map(response =>
          NextResponse.json({
            cidrs: Array.from(response.cidrs),
          })
        ),
        TE.mapLeft(error =>
          NextResponse.json(
            {
              title: "ManageKeyUpdateCIDRsError",
              status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
              detail: JSON.stringify(error)
            },
            { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
          )
        )
      )
    ),
    TE.toUnion
  );
