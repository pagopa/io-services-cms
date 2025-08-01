import { Activations } from "@io-services-cms/models";
import * as t from "io-ts";

export const EnrichedActivation = t.intersection([
  Activations.Activation,
  t.type({ userPDVId: t.string }),
]);

export type EnrichedActivation = t.TypeOf<typeof EnrichedActivation>;
