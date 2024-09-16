import { Service } from "@pagopa/io-functions-commons/dist/src/models/service";
import * as t from "io-ts";

export const LegacyService = t.intersection([
  Service,
  t.type({ version: t.number }),
  t.partial({
    cmsTag: t.boolean,
  }),
]);

export type LegacyService = t.TypeOf<typeof LegacyService>;

export const LegacyServiceCosmosResource = t.intersection([
  LegacyService,
  t.type({ _ts: t.Integer }),
]);

export type LegacyServiceCosmosResource = t.TypeOf<
  typeof LegacyServiceCosmosResource
>;
