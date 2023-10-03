/**
 * Module for the management of the manage key, contains the business logic for the /keys/manage apis
 */

import { NextResponse } from "next/server";
import { ApimUtils } from "@io-services-cms/external-clients";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

//TODO: token details are needed in order to retrieve such keys
export const getManageKeys = (apimService: ApimUtils.ApimService) =>
  pipe(
    "subscritionId", //TODO: retrieve from token the subscriptionId (id of the user's manage Subscription)
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
    TE.map(response => NextResponse.json(response))
  );
