import * as t from "io-ts";

const OrganizationData = t.intersection([
  t.type({
    name: t.string,
    fiscal_code: t.string,
  }),
  t.partial({
    // optional, as it's an external reference not present in legacy data
    id: t.string,
    department_name: t.string,
  }),
]);

const ServiceData = t.intersection([
  t.type({
    name: t.string,
    require_secure_channel: t.boolean,
    authorized_recipients: t.array(t.string),
    max_allowed_payment_amount: t.number,
  }),
  t.partial({ description: t.string }),
]);

const ServiceMetadata = t.intersection([
  t.type({
    scope: t.union([t.literal("NATIONAL"), t.literal("LOCAL")]),
  }),
  t.partial({
    address: t.string,
    appAndroid: t.string,
    appIos: t.string,
    cta: t.string,
    description: t.string,
    email: t.string,
    pec: t.string,
    phone: t.string,
    privacyUrl: t.string,
    supportUrl: t.string,
    tokenName: t.string,
    tosUrl: t.string,
    webUrl: t.string,
  }),
]);

export type ServiceId = t.TypeOf<typeof ServiceId>;
export const ServiceId = t.string;

export type Service = t.TypeOf<typeof Service>;
export const Service = t.type({
  id: ServiceId,
  data: t.intersection([
    ServiceData,
    t.type({ organization: OrganizationData, metadata: ServiceMetadata }),
  ]),
});
