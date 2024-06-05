import {
  IWithinRangeIntegerTag,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
  OrganizationFiscalCode,
  PatternString,
} from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export type MaxAllowedAmount = t.TypeOf<typeof MaxAllowedAmount>;
export const MaxAllowedAmount = t.union([
  WithinRangeInteger<0, 9999999999, IWithinRangeIntegerTag<0, 9999999999>>(
    0,
    9999999999
  ),
  t.literal(9999999999),
]);

export type Cidr = t.TypeOf<typeof Cidr>;
export const Cidr = PatternString(
  "^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"
);

export type HttpOrHttpsUrlString = t.TypeOf<typeof HttpOrHttpsUrlString>;
export const HttpOrHttpsUrlString = PatternString("^https?:\\S+$");

export const OrganizationData = t.intersection([
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
  authorized_recipients: withDefault(t.array(FiscalCode), []),
  max_allowed_payment_amount: withDefault(
    MaxAllowedAmount,
    0 as MaxAllowedAmount
  ),
  authorized_cidrs: withDefault(t.array(Cidr), []),
});

export const ServiceMetadata = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: NonEmptyString,
    app_android: NonEmptyString,
    app_ios: NonEmptyString,
    cta: NonEmptyString,
    description: NonEmptyString,
    email: NonEmptyString,
    pec: NonEmptyString,
    phone: NonEmptyString,
    privacy_url: NonEmptyString,
    support_url: NonEmptyString,
    token_name: NonEmptyString,
    tos_url: NonEmptyString,
    web_url: NonEmptyString,
    category: t.union([t.literal("STANDARD"), t.literal("SPECIAL")]),
    custom_special_flow: NonEmptyString,
    topic_id: t.number,
  }),
]);

const ServiceMetadataStrict = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
    privacy_url: HttpOrHttpsUrlString,
  }),
  t.partial({
    address: NonEmptyString,
    app_android: HttpOrHttpsUrlString,
    app_ios: HttpOrHttpsUrlString,
    cta: NonEmptyString,
    description: NonEmptyString,
    email: EmailString,
    pec: EmailString,
    phone: NonEmptyString,
    support_url: HttpOrHttpsUrlString,
    token_name: NonEmptyString,
    tos_url: HttpOrHttpsUrlString,
    web_url: HttpOrHttpsUrlString,
    category: t.union([t.literal("STANDARD"), t.literal("SPECIAL")]),
    custom_special_flow: NonEmptyString,
    topic_id: t.number,
  }),
]);

export type ServiceId = t.TypeOf<typeof ServiceId>;
export const ServiceId = NonEmptyString;

export type Service = t.TypeOf<typeof Service>;
export const Service = t.intersection([
  t.type({
    id: ServiceId,
    data: t.intersection([
      ServiceData,
      t.type({ organization: OrganizationData, metadata: ServiceMetadata }),
    ]),
  }),
  t.partial({
    version: NonEmptyString,
    last_update: NonEmptyString,
  }),
]);

export type ServiceStrict = t.TypeOf<typeof ServiceStrict>;
export const ServiceStrict = t.intersection([
  t.type({
    id: ServiceId,
    data: t.intersection([
      ServiceData,
      t.type({
        organization: OrganizationData,
        metadata: ServiceMetadataStrict,
      }),
    ]),
  }),
  t.partial({
    version: NonEmptyString,
    last_update: NonEmptyString,
  }),
]);
