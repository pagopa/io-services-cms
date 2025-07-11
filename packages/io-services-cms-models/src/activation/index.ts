import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { ServiceId } from "../service-lifecycle/definitions";

export const Activation = t.type({
  fiscalCode: FiscalCode,
  lastUpdate: t.Integer,
  serviceId: ServiceId,
  status: t.union([
    t.literal("ACTIVE"),
    t.literal("INACTIVE"),
    t.literal("PENDING"),
  ]),
});

export type Activation = t.TypeOf<typeof Activation>;
