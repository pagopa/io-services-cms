import { Activation } from "@io-services-cms/models";
import * as t from "io-ts";

export const EnrichedActivation = t.intersection([
  Activation,
  t.type({ userPDVId: t.string }),
]);

export type EnrichedActivation = t.TypeOf<typeof EnrichedActivation>;
