import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import {
  OrganizationData,
  ServiceId,
  ServiceMetadata,
} from "../service-lifecycle/definitions";

export type ServiceDetail = t.TypeOf<typeof ServiceDetail>;
export const ServiceDetail = t.type({
  id: ServiceId,
  name: NonEmptyString,
  description: NonEmptyString,
  metadata: ServiceMetadata,
  organization: OrganizationData,
  require_secure_channel: withDefault(t.boolean, false),
  kind: t.union([t.literal("publication"), t.literal("lifecycle")]),
  cms_last_update_ts: t.Integer, // this will be used to value the version field on the serviceDetails(pp-backend api)
});
