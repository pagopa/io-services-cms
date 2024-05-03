import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import {
  OrganizationData,
  ServiceId,
  ServiceMetadata,
} from "../service-lifecycle/definitions";

export type ServiceDetail = t.TypeOf<typeof ServiceDetail>;
export const ServiceDetail = t.intersection([
  t.type({
    id: ServiceId,
    name: NonEmptyString,
    description: NonEmptyString,
    require_secure_channel: withDefault(t.boolean, false),
    kind: t.union([t.literal("publication"), t.literal("lifecycle")]),
  }),
  t.partial({
    organization: OrganizationData,
    metadata: ServiceMetadata,
  }),
]);
