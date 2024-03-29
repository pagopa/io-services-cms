/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { OnboardingResponse } from "./OnboardingResponse";
import * as t from "io-ts";

// required attributes
const OnboardingsResponseR = t.interface({});

// optional attributes
const OnboardingsResponseO = t.partial({
  onboardings: t.readonlyArray(
    OnboardingResponse,
    "array of OnboardingResponse"
  )
});

export const OnboardingsResponse = t.exact(
  t.intersection(
    [OnboardingsResponseR, OnboardingsResponseO],
    "OnboardingsResponse"
  )
);

export type OnboardingsResponse = t.TypeOf<typeof OnboardingsResponse>;
