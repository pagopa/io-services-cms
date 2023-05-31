import * as t from "io-ts";
import * as tt from "io-ts-types";
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
    last_update: tt.date,
  }),
]);
