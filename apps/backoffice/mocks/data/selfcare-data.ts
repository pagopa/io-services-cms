import { SelfcareRoles } from "@/types/auth";
import { faker } from "@faker-js/faker/locale/it";

const MAX_ARRAY_LENGTH = 20;

export const aMockedIdentiyToken =
  "eyJraWQiOiJkNDoxZDo4YzpkOTo4ZjowMDpiMjowNDplOTo4MDowOTo5ODplYzpmODo0Mjo3ZSIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwiaWF0IjoxNjk2NTExNDI1LCJleHAiOjE3OTY1MTE0NDAsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NzA3NSIsImp0aSI6IjUyMjE2OTkyLTY3MGEtNDUzYi1hYTVmLWU4NmI0ZGM3OGM3YSIsIm9yZ2FuaXphdGlvbiI6eyJpZCI6Ijc0ZGFlZmRhLTdlNzItNDZlMi04MTVhLWIyNmQzYmY5ODk4OCIsIm5hbWUiOiJDb211bmUgZGkgQ2lzdGVybmlubyIsInJvbGVzIjpbeyJwYXJ0eVJvbGUiOiJERUxFR0FURSIsInJvbGUiOiJhZG1pbiJ9XSwic3ViVW5pdENvZGUiOm51bGwsInN1YlVuaXRUeXBlIjoiRUMiLCJhb29QYXJlbnQiOm51bGwsInBhcmVudERlc2NyaXB0aW9uIjpudWxsLCJyb290UGFyZW50Ijp7ImlkIjpudWxsLCJkZXNjcmlwdGlvbiI6bnVsbH0sImZpc2NhbF9jb2RlIjoiODEwMDE0NzA3NDkiLCJpcGFDb2RlIjoiY19jNzQxIn0sImRlc2lyZWRfZXhwIjoxNjk2NTQzNzczfQ.VPKdZhVJBupSiglfnMITNhYPgHTr3-tbl9fACDQe75SrwXdv2hnKrewVAwzL24xgtWPIo6O0FGmF1a0pouCFWfdY7MJalc2ADPB2OP78pOA-Qejv4rRYKXZgakECCgImpvvVouFXjdRnS7zAIxiiDLUWARcSuApCysG0lldYGAIOb2IAobRWdVJ9B_3yoDFmDKK0kLjpmpzaCoNqWUiL-uKbjYpuLQsUyhJbX-2BHvKLHevYO8GV-0hVmCE2VbtAFJfSKtzFCkL65UOuRrpAhdADBuM-Vc4q4swskaU5fpsOX4JrH388t6UfYArlY66PpNxktQxfUVglUtJmE2hvKA";
export const aMockedChangeInstitutionIdentiyToken =
  "eyJraWQiOiJkNDoxZDo4YzpkOTo4ZjowMDpiMjowNDplOTo4MDowOTo5ODplYzpmODo0Mjo3ZSIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwiaWF0IjoxNjk2NTExNDI1LCJleHAiOjE3OTY1MTE0NDAsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NzA3NSIsImp0aSI6IjUyMjE2OTkyLTY3MGEtNDUzYi1hYTVmLWU4NmI0ZGM3OGM3YSIsIm9yZ2FuaXphdGlvbiI6eyJpZCI6Ijc0ZGFlZmRhLTdlNzItNDZlMi04MTVhLWIyNmQzYmY5ODk4OSIsIm5hbWUiOiJDb211bmUgZGkgUm9tYSIsInJvbGVzIjpbeyJwYXJ0eVJvbGUiOiJERUxFR0FURSIsInJvbGUiOiJvcGVyYXRvciJ9XSwic3ViVW5pdENvZGUiOm51bGwsInN1YlVuaXRUeXBlIjoiRUMiLCJhb29QYXJlbnQiOm51bGwsInBhcmVudERlc2NyaXB0aW9uIjpudWxsLCJyb290UGFyZW50Ijp7ImlkIjpudWxsLCJkZXNjcmlwdGlvbiI6bnVsbH0sImZpc2NhbF9jb2RlIjoiODEwMDE0NzA3NDAiLCJpcGFDb2RlIjoiY19jNzQyIn0sImRlc2lyZWRfZXhwIjoxNjk2NTQzNzczfQ.aLq0SX125cr63Syhhdx5iJPOtAEIJhl7GMNyvRUXXKvOI9_l11QPCAzdpYOsiMjR0smykqGAlnAZCCXl0cPWouglF10l5OrwsQ7K7Vm2C2Y_uP6z5zDte0NLsLPdyXea9HeOU7kOODVa0H3OITf0ZTSc_Hz4pS11JuGXw8TPHqNxh2lYrKzkfTJ8nFXPS01cVjVILhE2k6RHNuHOjA7-LFQ7tjR-hc0t_-pOgBxDd8aPrPPNxKLa_bnh8VlfKgC-urNBjrY6Aof0MsNDRYbItO0XwhPnss4M-oFAqXM0VXk5CGk6n6w_5QxLKZc1TJ3qp7nCxcMwrb-Rg6hiVqbmfw";

export const aWellKnown = {
  keys: [
    {
      kty: "RSA",
      n:
        "wxSYmYWPK7uoltGPLr8Pmo_atz0qjMY53M6pR43aPGNjSrpzU2HtTcgfdmm8P6Ckz5lCCVH5Zvk6YM09PQL7kavN994Z2Dr88xsGmGAKQAMN7KKjVZeHx6AFKvz4W9Q4IGmhNSxCNyVqiWPOp9AkME_H7RxaZfB5Cil9rrXb2d0hd9TrkB_QcQlmQxKV9jX0SXJ3HhnklwgQCNeL62OjoxHOydJwN5EV4XoXh0McKn1lLZFX4FsW2fpiKVnNC63Puu2SMk2qs_IoSzVVQ3EucmvnfKiDWj_lcdYvo1s1q3_3BTMFvfHsO5h8rowh8a2U5b_JmiN_ksZHeVg0Kdmquw",
      e: "AQAB",
      alg: "RS256",
      kid: "d4:1d:8c:d9:8f:00:b2:04:e9:80:09:98:ec:f8:42:7e",
      use: "sig"
    }
  ]
};

export const getMockInstitution = (institutionId?: string) => ({
  id: institutionId ?? faker.string.uuid(),
  externalId: faker.string.numeric(11),
  originId: faker.string
    .alphanumeric({ length: { min: 5, max: 10 } })
    .toUpperCase(),
  description: faker.company.name(),
  mailAddress: faker.internet.email(),
  address: faker.location.streetAddress(true),
  zipCode: faker.location.zipCode(),
  taxCode: faker.string.numeric(11),
  origin: "SELC",
  institutionType: faker.helpers.arrayElement([
    "GSP",
    "PA",
    "PG",
    "PSP",
    "PT",
    "SCP",
    "SA"
  ]),
  attributes: [
    {
      origin: faker.lorem.slug(1),
      code: faker.lorem.slug(1),
      description: faker.lorem.slug(1)
    }
  ],
  paymentServiceProvider: {
    abiCode: faker.string.numeric(5),
    businessRegisterNumber: faker.string.numeric(10),
    legalRegisterName: faker.company.name(),
    legalRegisterNumber: faker.string.numeric(8),
    vatNumberGroup: faker.datatype.boolean()
  },
  dataProtectionOfficer: {
    address: faker.location.streetAddress(true),
    email: faker.internet.email(),
    pec: faker.internet.email()
  },
  geographicTaxonomies: [
    {
      code: faker.location.countryCode(),
      desc: faker.location.state()
    },
    {
      code: faker.location.countryCode(),
      desc: faker.location.state()
    }
  ],
  rea: faker.lorem.slug(1),
  shareCapital: faker.lorem.slug(1),
  businessRegisterPlace: faker.lorem.slug(1),
  supportEmail: faker.internet.email(),
  supportPhone: faker.phone.number(),
  imported: faker.datatype.boolean(),
  logo: faker.image.url(),
  subunitCode: faker.string.numeric(5),
  subunitType: faker.lorem.slug(1),
  aooParentCode: faker.string.numeric(5),
  rootParent: {
    id: faker.string.uuid(),
    description: faker.company.name()
  }
});

export const getSelfCareProblemResponse = (status: number) => ({
  status,
  title: faker.lorem.slug(5),
  detail: faker.lorem.slug(5),
  instance: faker.lorem.slug(1),
  type: faker.lorem.slug(1),
  invalidParams: [
    {
      name: faker.lorem.slug(1),
      reason: faker.lorem.slug(1)
    }
  ]
});
