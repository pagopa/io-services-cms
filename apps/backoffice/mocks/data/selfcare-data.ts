import { faker } from "@faker-js/faker/locale/it";

const MAX_ARRAY_LENGTH = 20;

export const getMockInstitution = () => ({
  address: faker.location.streetAddress(true),
  assistanceContacts: {
    supportEmail: faker.internet.email(),
    supportPhone: faker.phone.number()
  },
  companyInformations: {
    businessRegisterPlace: faker.lorem.slug(1),
    rea: faker.lorem.slug(1),
    shareCapital: faker.lorem.slug(1)
  },
  dpoData: {
    address: faker.location.streetAddress(true),
    email: faker.internet.email(),
    pec: faker.internet.email()
  },
  externalId: faker.string.numeric(11),
  fiscalCode: faker.string.numeric(11),
  id: faker.string.uuid(),
  institutionType: faker.helpers.arrayElement([
    "GSP",
    "PA",
    "PSP",
    "PT",
    "SCP"
  ]),
  mailAddress: faker.internet.email(),
  name: faker.company.name(),
  origin: "SELC",
  originId: faker.string
    .alphanumeric({ length: { min: 5, max: 10 } })
    .toUpperCase(),
  pspData: {
    abiCode: faker.string.numeric(5),
    businessRegisterNumber: faker.string.numeric(10),
    legalRegisterName: faker.company.name(),
    legalRegisterNumber: faker.string.numeric(8),
    vatNumberGroup: faker.datatype.boolean()
  },
  recipientCode: faker.string.alphanumeric({ length: { min: 5, max: 10 } }),
  status: "ACTIVE",
  userProductRoles: [
    ...Array.from(
      Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()
    )
  ].map(_ => faker.lorem.slug(1))
});
