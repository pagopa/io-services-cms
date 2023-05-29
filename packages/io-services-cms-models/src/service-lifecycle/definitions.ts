import * as t from "io-ts";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import {
  IWithinRangeIntegerTag,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";

type MaxAllowedAmount = t.TypeOf<typeof MaxAllowedAmount>;
const MaxAllowedAmount = t.union([
  WithinRangeInteger<0, 9999999999, IWithinRangeIntegerTag<0, 9999999999>>(
    0,
    9999999999
  ),
  t.literal(9999999999),
]);

const OrganizationData = t.intersection([
  t.type({
    name: NonEmptyString,
    fiscal_code: OrganizationFiscalCode,
  }),
  t.partial({
    // optional, as it's an external reference not present in legacy data
    id: NonEmptyString,
    department_name: NonEmptyString,
  }),
]);

const ServiceData = t.type({
  name: NonEmptyString,
  description: NonEmptyString,
  require_secure_channel: withDefault(t.boolean, false),
  authorized_recipients: withDefault(t.array(t.string), []),
  max_allowed_payment_amount: withDefault(
    MaxAllowedAmount,
    0 as MaxAllowedAmount
  ),
});

const ServiceMetadata = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: NonEmptyString,
    appAndroid: NonEmptyString,
    appIos: NonEmptyString,
    cta: NonEmptyString,
    description: NonEmptyString,
    email: NonEmptyString,
    pec: NonEmptyString,
    phone: NonEmptyString,
    privacyUrl: NonEmptyString,
    supportUrl: NonEmptyString,
    tokenName: NonEmptyString,
    tosUrl: NonEmptyString,
    webUrl: NonEmptyString,
  }),
]);

export type ServiceId = t.TypeOf<typeof ServiceId>;
export const ServiceId = NonEmptyString;

export type Service = t.TypeOf<typeof Service>;
export const Service = t.type({
  id: ServiceId,
  data: t.intersection([
    ServiceData,
    t.type({ organization: OrganizationData, metadata: ServiceMetadata }),
  ]),
});

/**
 * **io-ts** definition of `@azure/cosmos` **Resource**
 */
export type Resource = t.TypeOf<typeof Resource>;
export const Resource = t.type({
  /** Required. User settable property. Unique name that identifies the item, that is, no two items share the same ID within a database. The id must not exceed 255 characters. */
  id: NonEmptyString,
  /** System generated property. The resource ID (_rid) is a unique identifier that is also hierarchical per the resource stack on the resource model. It is used internally for placement and navigation of the item resource. */
  _rid: NonEmptyString,
  /** System generated property. Specifies the last updated timestamp of the resource. The value is a timestamp. */
  _ts: t.number,
  /** System generated property. The unique addressable URI for the resource. */
  _self: NonEmptyString,
  /** System generated property. Represents the resource etag required for optimistic concurrency control. */
  _etag: NonEmptyString,
});

export type ServiceResource = t.TypeOf<typeof ServiceResource>;
export const ServiceResource = t.intersection([Service, Resource]);
