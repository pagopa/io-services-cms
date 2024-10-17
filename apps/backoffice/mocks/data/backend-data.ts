import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { faker } from "@faker-js/faker/locale/it";

import packageJson from "../../package.json";

const MAX_ARRAY_LENGTH = 20;

export const anInfoVersion = {
  name: packageJson.name,
  version: packageJson.version,
};

export const aMockServiceTopicsArray = [
  {
    id: 0,
    name: "Altro",
  },
  {
    id: 1,
    name: "Ambiente e animali",
  },
  {
    id: 2,
    name: "Attività produttive e commercio",
  },
  {
    id: 3,
    name: "Benessere sociale",
  },
  {
    id: 4,
    name: "Casa e utenze",
  },
  {
    id: 5,
    name: "Cultura, tempo libero e sport",
  },
  {
    id: 6,
    name: "Educazione e formazione",
  },
  {
    id: 7,
    name: "Giustizia e legge",
  },
  {
    id: 8,
    name: "Lavori edilizi, catasto e urbanistica",
  },
  {
    id: 9,
    name: "Mobilità e trasporti",
  },
  {
    id: 10,
    name: "Redditi, patrimoni e fisco",
  },
  {
    id: 11,
    name: "Servizi anagrafici e civici",
  },
  {
    id: 12,
    name: "Servizi elettorali",
  },
  {
    id: 13,
    name: "Sicurezza e Protezione Civile",
  },
  {
    id: 14,
    name: "Suolo, spazi e beni pubblici",
  },
  {
    id: 15,
    name: "Viaggi e turismo",
  },
  {
    id: 16,
    name: "Vita lavorativa",
  },
  {
    id: 17,
    name: "Salute",
  },
];

export const aMockServiceCTASingle = `---\nit:\n  cta_1: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\nen:\n  cta_1: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n---`;

export const aMockServiceCTADouble = `---\nit:\n  cta_1: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n  cta_2: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\nen:\n  cta_1: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n  cta_2: \n    text: \"${faker.lorem.words(
  2,
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n---`;

export const getMockServiceLifecycle = (serviceId?: string) => ({
  authorized_cidrs: [
    ...Array.from(Array(faker.number.int({ max: 5, min: 1 })).keys()),
  ].map(
    (_) =>
      `${faker.internet.ipv4()}/${faker.helpers.rangeToNumber({
        max: 32,
        min: 0,
      })}`,
  ),
  authorized_recipients: faker.helpers.arrayElements(
    [
      "AAAAAA00A00A000A",
      "RSSMRA80A01F205X",
      "VRDLNZ69P01H501H",
      "BNCMRA55H50A944J",
      "SLAFNC76B68G273U",
    ],
    { max: 5, min: 0 },
  ),
  description: faker.lorem.sentence({ max: 50, min: 10 }),
  id: serviceId ?? faker.string.alphanumeric(26).toUpperCase(),
  last_update: faker.date.recent({ days: 90 }).toISOString(),
  max_allowed_payment_amount: faker.number.int({ max: 1000000, min: 0 }),
  metadata: {
    address: faker.location.streetAddress({ useFullAddress: true }),
    app_android: faker.internet.url(),
    app_ios: faker.internet.url(),
    category: faker.helpers.arrayElement(["SPECIAL", "STANDARD"]),
    cta: faker.helpers.arrayElement([
      aMockServiceCTASingle,
      aMockServiceCTADouble,
      undefined,
    ]),
    custom_special_flow: faker.lorem.slug(1),
    email: faker.internet.email(),
    pec: faker.internet.email(),
    phone: faker.phone.number(),
    privacy_url: faker.internet.url(),
    scope: faker.helpers.arrayElement(["NATIONAL", "LOCAL"]),
    support_url: faker.internet.url(),
    token_name: faker.lorem.slug(1),
    topic: faker.helpers.arrayElement([...aMockServiceTopicsArray, undefined]),
    tos_url: faker.internet.url(),
    web_url: faker.internet.url(),
  },
  name: faker.lorem.words({ max: 5, min: 3 }),
  organization: {
    department_name: faker.company.name(),
    fiscal_code: faker.string.numeric(11),
    name: faker.company.name(),
  },
  require_secure_channel: faker.datatype.boolean(),
  status: {
    reason: faker.lorem.sentence() + "|" + faker.lorem.sentence(),
    value: faker.helpers.arrayElement([
      "draft",
      "submitted",
      "approved",
      "rejected",
      "deleted",
    ]),
  },
  version: faker.number.int({ max: undefined, min: undefined }),
});

export const getMockServicePublication = (serviceId?: string) => ({
  ...getMockServiceLifecycle(serviceId),
  status: faker.helpers.arrayElement(["published", "unpublished"]),
});

export const getMockServiceHistoryItem = (serviceId?: string) => {
  const kind = faker.helpers.arrayElement(["lifecycle", "publication"]);
  const fsmState =
    kind === "publication"
      ? faker.helpers.arrayElement(["published", "unpublished"])
      : faker.helpers.arrayElement([
          "draft",
          "submitted",
          "approved",
          "rejected",
          "deleted",
        ]);
  return {
    ...getMockServiceLifecycle(serviceId),
    status: {
      kind: kind,
      reason: fsmState === "rejected" ? faker.lorem.sentence() : undefined,
      value: fsmState,
    },
  };
};

export const aMockServicePublication = {
  ...getMockServiceLifecycle(),
  status: faker.helpers.arrayElement(["published", "unpublished"]),
  //version: faker.string.uuid()
};

export const getMockServiceKeys = () => ({
  primary_key: faker.string.alphanumeric(32),
  secondary_key: faker.string.alphanumeric(32),
});

export const aMockManageKeysCIDRs: ManageKeyCIDRs = {
  cidrs: [
    ...Array.from(Array(faker.number.int({ max: 5, min: 1 })).keys()),
  ].map(
    (_) =>
      `${faker.internet.ipv4()}/${faker.helpers.rangeToNumber({
        max: 32,
        min: 0,
      })}` as Cidr,
  ),
};

const getMockServicePagination = (limit?: number, offset?: number) => {
  const purifiedLimit = limit ?? faker.helpers.arrayElement([10, 20, 50, 100]);
  const purifiedOffset =
    (offset && offset > 0 && offset < 99) ??
    faker.number.int({ max: 99, min: 0 });

  const total = [
    ...Array.from(
      Array(faker.number.int({ max: MAX_ARRAY_LENGTH, min: 1 })).keys(),
    ),
  ];

  return {
    pagination: {
      count: total.length,
      limit: purifiedLimit,
      offset: purifiedOffset,
    },
    value: total.map((_) => getMockServiceLifecycle()),
  };
};

export const aMockServicePagination = getMockServicePagination();
export const aMockServicePaginationLimitOffset = (
  limit?: number,
  offset?: number,
) => getMockServicePagination(limit, offset);

export const getMockServiceList = (
  limit?: number,
  offset?: number,
  id?: string,
) => {
  const purifiedLimit = limit ?? faker.helpers.arrayElement([10, 20, 50, 100]);
  const purifiedOffset =
    offset !== undefined && offset >= 0 && offset < 99
      ? offset
      : faker.number.int({ max: 99, min: 0 });

  const total = id ? [1] : [...Array.from(Array(purifiedLimit).keys())];

  return {
    pagination: {
      count: id ? 1 : 100,
      limit: purifiedLimit,
      offset: purifiedOffset,
    },
    value: total.map((_) => ({
      ...getMockServiceLifecycle(),
      visibility: faker.helpers.arrayElement([
        "published",
        "unpublished",
        undefined,
      ]),
    })),
  };
};

export const aMockServiceTopics = {
  topics: aMockServiceTopicsArray,
};

export const getMockServiceHistory = (
  serviceId: string,
  order: "ASC" | "DESC" | null,
  limit: null | string,
  continuationToken: null | string,
) => {
  const purifiedLimit = limit ? +limit : 10;
  const total = [
    ...Array.from(
      Array(faker.number.int({ max: purifiedLimit, min: 1 })).keys(),
    ),
  ];

  return {
    continuationToken: faker.helpers.arrayElement([
      faker.string.alphanumeric({ length: { max: 10, min: 5 } }),
      undefined,
    ]),
    items: total
      .map((_) => getMockServiceHistoryItem(serviceId))
      .sort((a, b) =>
        order
          ? order === "DESC"
            ? new Date(b.last_update).getTime() -
              new Date(a.last_update).getTime()
            : new Date(a.last_update).getTime() -
              new Date(b.last_update).getTime()
          : new Date(b.last_update).getTime() -
            new Date(a.last_update).getTime(),
      ),
  };
};

export const getMockInstitutionGroups = (institutionId?: string) =>
  Array.from({ length: 3 }, () => ({
    id: faker.string.uuid(),
    name: faker.lorem.word(),
  }));

// **********************************************************************
// Services import into SelfCare
// **********************************************************************
export const getMockServicesMigrationDelegate = () => ({
  sourceEmail: faker.internet.email(),
  sourceId: faker.string.alphanumeric(26).toUpperCase(),
  sourceName: faker.person.firstName(),
  sourceSurname: faker.person.lastName(),
  subscriptionCounter: faker.number.int({ max: MAX_ARRAY_LENGTH, min: 0 }),
});

export const getMockServicesMigrationLatestStatus = () => ({
  completed: faker.number.int({ max: 3, min: 0 }),
  failed: faker.number.int({ max: 3, min: 0 }),
  initial: 0,
  processing: faker.number.int({ max: 3, min: 0 }),
});

export const getMockServicesMigrationStatusDetails = () => ({
  data: {
    completed: faker.number.int({ max: 3, min: 0 }),
    failed: faker.number.int({ max: 3, min: 0 }),
    initial: faker.number.int({ max: 3, min: 0 }),
    processing: faker.number.int({ max: 3, min: 0 }),
  },
});

export const getIoServicesError = (status: number) => ({
  detail: faker.lorem.sentence(),
  status: status,
  title: faker.lorem.sentence(),
});
