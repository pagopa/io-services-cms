import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { faker } from "@faker-js/faker/locale/it";
import packageJson from "../../package.json";

const MAX_ARRAY_LENGTH = 20;

export const aMockJwtSessionToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTQ4Nzg3MzgsImlhdCI6MTY5NDc5MjMzOCwiaXNzIjoiaHR0cHM6Ly9zZWxmY2FyZS5pby5wYWdvcGEuaXQiLCJqdGkiOiIwMUhBN04ySEVRQVhBSzY3OUREVzE2MUNDUSIsImZhbWlseV9uYW1lIjoiUk9TU0kiLCJnaXZlbl9uYW1lIjoiTUFSSU8iLCJlbWFpbCI6Im1hcmlvLnJvc3NpQGVtYWlsLml0IiwiZmlzY2FsX2NvZGUiOiJSU1NNUkEwMEEwMUYyMDVGIiwiaW5zdGl0dXRpb24iOnsiaWQiOiIxNDFiNDAyYi03OWU3LTRkMzktYTcyOS01ZjMxYmY1YzFhNzEiLCJuYW1lIjoiQ29tdW5lIGRpIFRlc3QiLCJyb2xlIjoiYWRtaW4iLCJsb2dvX3VybCI6Imh0dHBzOi8vYWdpZC5kaWdpdGFscGEuaXQvbWVkaWEvaW1hZ2VzL3N0ZW1tYS5wbmcifSwiYXV0aG9yaXplZF9pbnN0aXR1dGlvbnMiOlt7ImlkIjoiMTQxYjQwMmItNzllNy00ZDM5LWE3MjktNWYzMWJmNWMxYTcxIiwibmFtZSI6IkNvbXVuZSBkaSBUZXN0Iiwicm9sZSI6ImFkbWluIn0seyJpZCI6IjI1MmI0MDJiLTc5ZTctNGQzOS1hNzI5LTVmMzFiZjVjMWE3MiIsIm5hbWUiOiJDb211bmUgZGkgRGV2Iiwicm9sZSI6Im9wZXJhdG9yIn1dLCJwYXJhbWV0ZXJzIjp7InVzZXJfaWQiOiIwMUhBN04ySEVRQVhBSzY3OUREVzE2MUNDUSIsInVzZXJfZW1haWwiOiJ0ZXN0QGNvbXVuZS5pdCIsInVzZXJfZ3JvdXBzIjpbImFwaWFkbWluIiwiYXBpaW5mb3JlYWQiLCJhcGlsaW1pdGVkbWVzc2FnZXdyaXRlIiwiYXBpbGltaXRlZHByb2ZpbGVyZWFkIiwiYXBpbWVzc2FnZXJlYWQiLCJhcGlzZXJ2aWNlcmVhZCIsImFwaXNlcnZpY2V3cml0ZSIsImRldmVsb3BlcnMiXSwic3Vic2NyaXB0aW9uX2lkIjoiMDFHTTVOM0hBUUFaQUs2NzlSUlcxMjlCQlIifX0.sTLmYkxADJwPF2IQhm46zj0v_2JRv2dWbxPzkpEGJLw";

export const anInfoVersion = {
  name: packageJson.name,
  version: packageJson.version
};

export const getMockServiceLifecycle = (serviceId?: string) => ({
  id: serviceId ?? faker.string.alphanumeric(26).toUpperCase(),
  status: {
    value: faker.helpers.arrayElement([
      "draft",
      "submitted",
      "approved",
      "rejected",
      "deleted"
    ]),
    reason: faker.lorem.sentence() + "|" + faker.lorem.sentence()
  },
  version: faker.number.int({ min: undefined, max: undefined }),
  last_update: faker.date.recent({ days: 30 }).toISOString(),
  name: faker.lorem.words({ min: 3, max: 5 }),
  description: faker.lorem.sentence({ min: 10, max: 50 }),
  organization: {
    name: faker.company.name(),
    fiscal_code: faker.string.numeric(11),
    department_name: faker.company.name()
  },
  require_secure_channel: faker.datatype.boolean(),
  authorized_recipients: faker.helpers.arrayElements(
    [
      "AAAAAA00A00A000A",
      "RSSMRA80A01F205X",
      "VRDLNZ69P01H501H",
      "BNCMRA55H50A944J",
      "SLAFNC76B68G273U"
    ],
    { min: 0, max: 5 }
  ),
  authorized_cidrs: [
    ...Array.from(Array(faker.number.int({ min: 1, max: 5 })).keys())
  ].map(
    _ =>
      `${faker.internet.ipv4()}/${faker.helpers.rangeToNumber({
        min: 0,
        max: 32
      })}`
  ),
  max_allowed_payment_amount: faker.number.int({ min: 0, max: 1000000 }),
  metadata: {
    web_url: faker.internet.url(),
    app_ios: faker.internet.url(),
    app_android: faker.internet.url(),
    tos_url: faker.internet.url(),
    privacy_url: faker.internet.url(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    pec: faker.internet.email(),
    cta: `"---\nit:\n  cta_1: \n    text: \"${faker.lorem.words(
      2
    )}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\nen:\n  cta_1: \n    text: \"${faker.lorem.words(
      2
    )}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n---"`,
    token_name: faker.lorem.slug(1),
    support_url: faker.internet.url(),
    category: faker.helpers.arrayElement(["SPECIAL", "STANDARD"]),
    custom_special_flow: faker.lorem.slug(1),
    scope: faker.helpers.arrayElement(["NATIONAL", "LOCAL"])
  }
});

export const aMockServicePublication = {
  ...getMockServiceLifecycle(),
  status: faker.helpers.arrayElement(["published", "unpublished"])
  //version: faker.string.uuid()
};

export const getMockServiceKeys = () => ({
  primary_key: faker.string.alphanumeric(32),
  secondary_key: faker.string.alphanumeric(32)
});

export const aMockManageKeysCIDRs: ManageKeyCIDRs = {
  cidrs: [
    ...Array.from(Array(faker.number.int({ min: 1, max: 5 })).keys())
  ].map(
    _ =>
      `${faker.internet.ipv4()}/${faker.helpers.rangeToNumber({
        min: 0,
        max: 32
      })}` as Cidr
  )
};

const getMockServicePagination = (limit?: number, offset?: number) => {
  const purifiedLimit = limit ?? faker.helpers.arrayElement([10, 20, 50, 100]);
  const purifiedOffset =
    (offset && offset > 0 && offset < 99) ??
    faker.number.int({ min: 0, max: 99 });

  const total = [
    ...Array.from(
      Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()
    )
  ];

  return {
    value: total.map(_ => getMockServiceLifecycle()),
    pagination: {
      offset: purifiedOffset,
      limit: purifiedLimit,
      count: total.length
    }
  };
};

export const aMockServicePagination = getMockServicePagination();
export const aMockServicePaginationLimitOffset = (
  limit?: number,
  offset?: number
) => getMockServicePagination(limit, offset);

export const getMockServiceList = (
  limit?: number,
  offset?: number,
  id?: string
) => {
  const purifiedLimit = limit ?? faker.helpers.arrayElement([10, 20, 50, 100]);
  const purifiedOffset =
    offset !== undefined && offset >= 0 && offset < 99
      ? offset
      : faker.number.int({ min: 0, max: 99 });

  const total = id ? [1] : [...Array.from(Array(purifiedLimit).keys())];

  return {
    value: total.map(_ => ({
      ...getMockServiceLifecycle(),
      visibility: faker.helpers.arrayElement([
        "published",
        "unpublished",
        undefined
      ])
    })),
    pagination: {
      offset: purifiedOffset,
      limit: purifiedLimit,
      count: id ? 1 : 100
    }
  };
};

// **********************************************************************
// Services import into SelfCare
// **********************************************************************
export const getMockServicesMigrationDelegate = () => ({
  sourceEmail: faker.internet.email(),
  sourceId: faker.string.alphanumeric(26).toUpperCase(),
  sourceName: faker.person.firstName(),
  sourceSurname: faker.person.lastName(),
  subscriptionCounter: faker.number.int({ min: 0, max: MAX_ARRAY_LENGTH })
});

export const getMockServicesMigrationLatestStatus = () => ({
  completed: faker.number.int({ min: 0, max: 3 }),
  failed: faker.number.int({ min: 0, max: 3 }),
  initial: 0,
  processing: faker.number.int({ min: 0, max: 3 })
});

export const getMockServicesMigrationStatusDetails = () => ({
  data: {
    completed: faker.number.int({ min: 0, max: 3 }),
    failed: faker.number.int({ min: 0, max: 3 }),
    initial: faker.number.int({ min: 0, max: 3 }),
    processing: faker.number.int({ min: 0, max: 3 })
  }
});

export const getIoServicesError = (status: number) => ({
  detail: faker.lorem.sentence(),
  status: status,
  title: faker.lorem.sentence()
});
