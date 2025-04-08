import { Activation } from "@pagopa/io-functions-commons/dist/src/models/activation";
import * as t from "io-ts";

export const LegacyActivation = t.intersection([
  Activation,
  t.type({ version: t.number }),
]);

export type LegacyActivation = t.TypeOf<typeof LegacyActivation>;

export const CosmosResource = t.intersection([
  LegacyActivation,
  t.type({ _ts: t.Integer }),
]);

export type CosmosResource = t.TypeOf<typeof CosmosResource>;
