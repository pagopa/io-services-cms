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
    9999999999,
  ),
  t.literal(9999999999),
]);

export type Cidr = t.TypeOf<typeof Cidr>;
export const Cidr = PatternString(
  "^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$",
);

export type HttpOrHttpsUrlString = t.TypeOf<typeof HttpOrHttpsUrlString>;
export const HttpOrHttpsUrlString = PatternString("^https?:\\S+$");

export const OrganizationData = t.intersection([
  t.type({
    fiscal_code: OrganizationFiscalCode,
    name: NonEmptyString,
  }),
  t.partial({
    department_name: NonEmptyString,
    // optional, as it's an external reference not present in legacy data
    id: NonEmptyString,
  }),
]);

const ServiceData = t.type({
  authorized_cidrs: withDefault(t.array(Cidr), []),
  authorized_recipients: withDefault(t.array(FiscalCode), []),
  description: NonEmptyString,
  max_allowed_payment_amount: withDefault(
    MaxAllowedAmount,
    0 as MaxAllowedAmount,
  ),
  name: NonEmptyString,
  require_secure_channel: withDefault(t.boolean, false),
});

export const ServiceMetadata = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: NonEmptyString,
    app_android: NonEmptyString,
    app_ios: NonEmptyString,
    category: t.union([t.literal("STANDARD"), t.literal("SPECIAL")]),
    cta: NonEmptyString,
    custom_special_flow: NonEmptyString,
    description: NonEmptyString,
    email: NonEmptyString,
    group_id: NonEmptyString,
    pec: NonEmptyString,
    phone: NonEmptyString,
    privacy_url: NonEmptyString,
    support_url: NonEmptyString,
    token_name: NonEmptyString,
    topic_id: t.number,
    tos_url: NonEmptyString,
    web_url: NonEmptyString,
  }),
]);

const ServiceMetadataQualityStrict = t.intersection([
  t.type({
    privacy_url: HttpOrHttpsUrlString,
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: NonEmptyString,
    app_android: HttpOrHttpsUrlString,
    app_ios: HttpOrHttpsUrlString,
    category: t.union([t.literal("STANDARD"), t.literal("SPECIAL")]),
    cta: NonEmptyString,
    custom_special_flow: NonEmptyString,
    description: NonEmptyString,
    group_id: NonEmptyString,
    token_name: NonEmptyString,
    topic_id: t.number,
    tos_url: HttpOrHttpsUrlString,
    web_url: HttpOrHttpsUrlString,
  }),
  t.union([
    t.intersection([
      t.type({
        email: EmailString,
      }),
      t.partial({
        pec: EmailString,

        phone: NonEmptyString,

        support_url: HttpOrHttpsUrlString,
      }),
    ]),
    t.intersection([
      t.type({
        pec: EmailString,
      }),
      t.partial({
        email: EmailString,

        phone: NonEmptyString,

        support_url: HttpOrHttpsUrlString,
      }),
    ]),
    t.intersection([
      t.type({
        phone: NonEmptyString,
      }),
      t.partial({
        email: EmailString,

        pec: EmailString,

        support_url: HttpOrHttpsUrlString,
      }),
    ]),
    t.intersection([
      t.type({
        support_url: HttpOrHttpsUrlString,
      }),
      t.partial({
        email: EmailString,

        pec: EmailString,

        phone: NonEmptyString,
      }),
    ]),
  ]),
]);

const ServiceMetadataStrict = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: NonEmptyString,
    app_android: HttpOrHttpsUrlString,
    app_ios: HttpOrHttpsUrlString,
    category: t.union([t.literal("STANDARD"), t.literal("SPECIAL")]),
    cta: NonEmptyString,
    custom_special_flow: NonEmptyString,
    description: NonEmptyString,
    email: EmailString,
    group_id: NonEmptyString,
    pec: EmailString,
    phone: NonEmptyString,
    privacy_url: HttpOrHttpsUrlString,
    support_url: HttpOrHttpsUrlString,
    token_name: NonEmptyString,
    topic_id: t.number,
    tos_url: HttpOrHttpsUrlString,
    web_url: HttpOrHttpsUrlString,
  }),
]);

export type ServiceId = t.TypeOf<typeof ServiceId>;
export const ServiceId = NonEmptyString;

export type Service = t.TypeOf<typeof Service>;
export const Service = t.intersection([
  t.type({
    data: t.intersection([
      ServiceData,
      t.type({ metadata: ServiceMetadata, organization: OrganizationData }),
    ]),
    id: ServiceId,
  }),
  t.partial({
    modified_at: t.Integer,
    version: NonEmptyString,
  }),
]);

export type ServiceStrict = t.TypeOf<typeof ServiceStrict>;
export const ServiceStrict = t.intersection([
  t.type({
    data: t.intersection([
      ServiceData,
      t.type({
        metadata: ServiceMetadataStrict,
        organization: OrganizationData,
      }),
    ]),
    id: ServiceId,
  }),
  t.partial({
    modified_at: t.Integer,
    version: NonEmptyString,
  }),
]);

export type ServiceQualityStrict = t.TypeOf<typeof ServiceQualityStrict>;
export const ServiceQualityStrict = t.intersection([
  ServiceStrict,
  t.type({
    data: t.intersection([
      ServiceData,
      t.type({
        metadata: ServiceMetadataQualityStrict,
        organization: OrganizationData,
      }),
    ]),
  }),
]);
