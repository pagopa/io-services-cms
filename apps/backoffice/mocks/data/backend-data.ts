import { faker } from "@faker-js/faker/locale/it";
import packageJson from "../../package.json";

const MAX_ARRAY_LENGTH = 20;

export const aMockJwtSessionToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTQ4Nzg3MzgsImlhdCI6MTY5NDc5MjMzOCwiaXNzIjoiaHR0cHM6Ly9zZWxmY2FyZS5pby5wYWdvcGEuaXQiLCJqdGkiOiIwMUhBN04ySEVRQVhBSzY3OUREVzE2MUNDUSIsImZhbWlseV9uYW1lIjoiUk9TU0kiLCJnaXZlbl9uYW1lIjoiTUFSSU8iLCJlbWFpbCI6Im1hcmlvLnJvc3NpQGVtYWlsLml0IiwiZmlzY2FsX2NvZGUiOiJSU1NNUkEwMEEwMUYyMDVGIiwib3JnYW5pemF0aW9uIjp7ImlkIjoiMTQxYjQwMmItNzllNy00ZDM5LWE3MjktNWYzMWJmNWMxYTc3IiwibmFtZSI6IkNvbXVuZSBkaSBUZXN0Iiwicm9sZSI6ImFkbWluIn0sInBhcmFtZXRlcnMiOnsidXNlcl9pZCI6IjAxSEE3TjJIRVFBWEFLNjc5RERXMTYxQ0NRIiwidXNlcl9lbWFpbCI6InRlc3RAY29tdW5lLml0IiwidXNlcl9ncm91cHMiOlsiYXBpYWRtaW4iLCJhcGlpbmZvcmVhZCIsImFwaWxpbWl0ZWRtZXNzYWdld3JpdGUiLCJhcGlsaW1pdGVkcHJvZmlsZXJlYWQiLCJhcGltZXNzYWdlcmVhZCIsImFwaXNlcnZpY2VyZWFkIiwiYXBpc2VydmljZXdyaXRlIiwiZGV2ZWxvcGVycyJdLCJzdWJzY3JpcHRpb25faWQiOiIwMUdNNU4zSEFRQVpBSzY3OVJSVzEyOUJCUiJ9fQ.hKy2FPDGRSBGUGYnr9vo4J1BhUBOE2ut7jXDuHgrKCY";

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
    reason: faker.lorem.sentence()
  },
  version: faker.number.int({ min: undefined, max: undefined }),
  last_update: new Date().toISOString(),
  name: faker.lorem.words({ min: 1, max: 5 }),
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
    ...Array.from(
      Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()
    )
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
    cta: faker.lorem.slug(1),
    token_name: faker.lorem.slug(1),
    support_url: faker.internet.url(),
    category: faker.helpers.arrayElement(["SPECIAL", "STANDARD"]),
    custom_special_flow: faker.lorem.slug(1),
    scope: faker.helpers.arrayElement(["NATIONAL", "LOCAL"])
  }
});

export const aMockServicePublication = {
  ...getMockServiceLifecycle(),
  status: faker.helpers.arrayElement(["published", "unpublished"]),
  version: faker.string.uuid()
};

export const aMockServiceKeys = {
  primary_key: faker.string.alphanumeric(32),
  secondary_key: faker.string.alphanumeric(32)
};

const getMockServicePagination = () => {
  const total = [
    ...Array.from(
      Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()
    )
  ];

  return {
    value: total.map(_ => getMockServiceLifecycle()),
    pagination: {
      offset: faker.number.int({ min: 0, max: 99 }),
      limit: faker.helpers.arrayElement([10, 20, 50, 100]),
      count: total.length
    }
  };
};

export const aMockServicePagination = getMockServicePagination();

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
  completed: faker.number.int({ min: 0, max: MAX_ARRAY_LENGTH }),
  failed: faker.number.int({ min: 0, max: MAX_ARRAY_LENGTH }),
  initial: faker.number.int({ min: 0, max: MAX_ARRAY_LENGTH }),
  processing: faker.number.int({ min: 0, max: MAX_ARRAY_LENGTH })
});

export const getMockServicesMigrationStatusDetails = () => ({
  data: {
    COMPLETED: faker.string.numeric({ length: { min: 0, max: 2 } }),
    FAILED: faker.string.numeric({ length: { min: 0, max: 2 } }),
    INITIAL: faker.string.numeric({ length: { min: 0, max: 2 } }),
    PROCESSING: faker.string.numeric({ length: { min: 0, max: 2 } })
  }
});
