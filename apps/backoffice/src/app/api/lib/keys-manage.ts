/**
 * Module for the management of the manage key, contains the business logic for the /keys/manage apis
 */

import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

export const retrieveManageKeys = (apimService: ApimUtils.ApimService) => (
  backOfficeUser: BackOfficeUser
) =>
  pipe(
    backOfficeUser.parameters.subscriptionId,
    apimService.listSecrets,
    TE.mapLeft(error =>
      NextResponse.json(
        {
          title: "ApimError",
          status: error.statusCode as any,
          detail: JSON.stringify(error)
        },
        { status: error.statusCode }
      )
    ),
    TE.map(response =>
      NextResponse.json({
        primaryKey: response.primaryKey,
        secondaryKey: response.secondaryKey
      })
    ),
    TE.toUnion
  );

export const regenerateManageKeys = (apimService: ApimUtils.ApimService) => (
  backOfficeUser: BackOfficeUser,
  keyType: string
) =>
  pipe(
    validateKeyType(keyType),
    E.mapLeft(error =>
      NextResponse.json(
        {
          title: "InvalidKeyType",
          status: 400,
          detail: error
        },
        { status: 400 }
      )
    ),
    TE.fromEither,
    TE.chainW(_ =>
      pipe(
        apimService.regenerateSubscriptionKey(
          backOfficeUser.parameters.subscriptionId,
          "primary" as any
        ),
        TE.mapLeft(error =>
          NextResponse.json(
            {
              title: "ApimError",
              status: error.statusCode as any,
              detail: JSON.stringify(error)
            },
            { status: error.statusCode }
          )
        )
      )
    ),
    TE.map(response =>
      NextResponse.json({
        primaryKey: response.primaryKey,
        secondaryKey: response.secondaryKey
      })
    ),
    TE.toUnion,
    x => x
  );

const validateKeyType = (keyType: string) =>
  pipe(
    keyType,
    E.fromPredicate(
      _ => _ === "primary" || _ === "secondary",
      _ => `Invalid key type: ${_}`
    )
  );
