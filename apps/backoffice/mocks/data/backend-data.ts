import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { faker } from "@faker-js/faker/locale/it";
import packageJson from "../../package.json";

const MAX_ARRAY_LENGTH = 20;

export const anInfoVersion = {
  name: packageJson.name,
  version: packageJson.version
};

export const aMockServiceTopicsArray = [
  {
    id: 0,
    name: "Altro"
  },
  {
    id: 1,
    name: "Ambiente e animali"
  },
  {
    id: 2,
    name: "Attività produttive e commercio"
  },
  {
    id: 3,
    name: "Benessere sociale"
  },
  {
    id: 4,
    name: "Casa e utenze"
  },
  {
    id: 5,
    name: "Cultura, tempo libero e sport"
  },
  {
    id: 6,
    name: "Educazione e formazione"
  },
  {
    id: 7,
    name: "Giustizia e legge"
  },
  {
    id: 8,
    name: "Lavori edilizi, catasto e urbanistica"
  },
  {
    id: 9,
    name: "Mobilità e trasporti"
  },
  {
    id: 10,
    name: "Redditi, patrimoni e fisco"
  },
  {
    id: 11,
    name: "Servizi anagrafici e civici"
  },
  {
    id: 12,
    name: "Servizi elettorali"
  },
  {
    id: 13,
    name: "Sicurezza e Protezione Civile"
  },
  {
    id: 14,
    name: "Suolo, spazi e beni pubblici"
  },
  {
    id: 15,
    name: "Viaggi e turismo"
  },
  {
    id: 16,
    name: "Vita lavorativa"
  },
  {
    id: 17,
    name: "Salute"
  }
];

export const aMockServiceCTASingle = `---\nit:\n  cta_1: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\nen:\n  cta_1: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n---`;

export const aMockServiceCTADouble = `---\nit:\n  cta_1: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n  cta_2: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\nen:\n  cta_1: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n  cta_2: \n    text: \"${faker.lorem.words(
  2
)}\"\n    action: \"iohandledlink://${faker.internet.url()}\"\n---`;

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
  last_update: faker.date.recent({ days: 90 }).toISOString(),
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
    cta: faker.helpers.arrayElement([
      aMockServiceCTASingle,
      aMockServiceCTADouble,
      undefined
    ]),
    token_name: faker.lorem.slug(1),
    support_url: faker.internet.url(),
    category: faker.helpers.arrayElement(["SPECIAL", "STANDARD"]),
    custom_special_flow: faker.lorem.slug(1),
    scope: faker.helpers.arrayElement(["NATIONAL", "LOCAL"]),
    topic: faker.helpers.arrayElement([...aMockServiceTopicsArray, undefined])
  }
});

export const getMockServicePublication = (serviceId?: string) => ({
  ...getMockServiceLifecycle(serviceId),
  status: faker.helpers.arrayElement(["published", "unpublished"])
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
          "deleted"
        ]);
  return {
    ...getMockServiceLifecycle(serviceId),
    status: {
      kind: kind,
      value: fsmState,
      reason: fsmState === "rejected" ? faker.lorem.sentence() : undefined
    }
  };
};

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

export const aMockServiceTopics = {
  topics: aMockServiceTopicsArray
};

export const getMockServiceHistory = (
  serviceId: string,
  order: "ASC" | "DESC" | null,
  limit: string | null,
  continuationToken: string | null
) => {
  const purifiedLimit = limit ? +limit : 10;
  const total = [
    ...Array.from(
      Array(faker.number.int({ min: 1, max: purifiedLimit })).keys()
    )
  ];

  return {
    items: total
      .map(_ => getMockServiceHistoryItem(serviceId))
      .sort((a, b) =>
        order
          ? order === "DESC"
            ? new Date(b.last_update).getTime() -
              new Date(a.last_update).getTime()
            : new Date(a.last_update).getTime() -
              new Date(b.last_update).getTime()
          : new Date(b.last_update).getTime() -
            new Date(a.last_update).getTime()
      ),
    continuationToken: faker.helpers.arrayElement([
      faker.string.alphanumeric({ length: { min: 5, max: 10 } }),
      undefined
    ])
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
