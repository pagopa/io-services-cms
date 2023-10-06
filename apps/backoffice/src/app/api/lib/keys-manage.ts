/**
 * Module for the management of the manage key, contains the business logic for the /keys/manage apis
 */

import { NextResponse } from "next/server";
import { ApimUtils } from "@io-services-cms/external-clients";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
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
