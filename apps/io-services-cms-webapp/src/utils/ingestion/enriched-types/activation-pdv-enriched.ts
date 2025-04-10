import { LegacyActivation } from "@io-services-cms/models";
import * as t from "io-ts";

export const EnrichedLegacyActivationCosmosResource: t.IntersectionType<
  [typeof LegacyActivation.CosmosResource, t.TypeC<{ userPDVId: t.StringC }>]
> = t.intersection([
  LegacyActivation.CosmosResource,
  t.type({ userPDVId: t.string }),
]);

export type EnrichedLegacyActivationCosmosResource = t.TypeOf<
  typeof EnrichedLegacyActivationCosmosResource
>;
