import { Activation as LegacyActivation } from "@pagopa/io-functions-commons/dist/src/models/activation";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { ServiceId } from "../service-lifecycle/definitions";
import { withCosmosDbColumns } from "../utils/cosmosdb";

export const Activation = t.type({
  fiscalCode: FiscalCode,
  modifiedAt: t.Integer,
  serviceId: ServiceId,
  status: t.union([
    t.literal("ACTIVE"),
    t.literal("INACTIVE"),
    t.literal("PENDING"),
  ]),
});
export type Activation = t.TypeOf<typeof Activation>;

export const LegacyCosmosResource = withCosmosDbColumns(LegacyActivation);
export type LegacyCosmosResource = t.TypeOf<typeof LegacyCosmosResource>;
