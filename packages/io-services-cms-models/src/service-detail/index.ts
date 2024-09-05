import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

import {
  OrganizationData,
  ServiceId,
  ServiceMetadata,
} from "../service-lifecycle/definitions";

export type ServiceDetail = t.TypeOf<typeof ServiceDetail>;
export const ServiceDetail = t.type({
  cms_last_update_ts: t.Integer, // this will be used to value the version field on the serviceDetails(pp-backend api)
  description: NonEmptyString,
  id: ServiceId,
  kind: t.union([t.literal("publication"), t.literal("lifecycle")]),
  metadata: ServiceMetadata,
  name: NonEmptyString,
  organization: OrganizationData,
  require_secure_channel: withDefault(t.boolean, false),
});
