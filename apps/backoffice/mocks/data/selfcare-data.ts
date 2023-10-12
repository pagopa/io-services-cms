import { faker } from "@faker-js/faker/locale/it";

const MAX_ARRAY_LENGTH = 20;

export const aMockedIdentiyToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ1aWRfMTIzNDUiLCJhdWQiOiJpby5zZWxmY2FyZS5wYWdvcGEuaXQiLCJpc3MiOiJodHRwOi8vc2VsZmNhcmUucGFnb3BhLml0IiwiaWF0IjoxNjk1MTE1NzM5LCJleHAiOjE2OTYxMTU3MzksImp0aSI6IjAxRkdTSDJCMzRIRlQzN1g0U0ozWFoyVllaIiwibmFtZSI6Ik1hcmlvIiwiZmFtaWx5X25hbWUiOiJSb3NzaSIsImZpc2NhbF9udW1iZXIiOiJHRE5OV0ExMkg4MVk4NzRGIiwiZW1haWwiOiJlbWFpbEBleGFtcGxlLmNvbSIsImRlc2lyZWRfZXhwIjoxNjMzNTI5MTgyLCJvcmdhbml6YXRpb24iOnsiaWQiOiJpbnRlcm5hbElEIiwiZmlzY2FsX2NvZGUiOiJvcmdhbml6YXRpb24gZmlzY2FsIG9yIHZhdCBudW1iZXIiLCJuYW1lIjoiT3JnYW5pemF0aW9uIGxlZ2FsIG5hbWUiLCJyb2xlcyI6W3sicGFydHlSb2xlIjoiT1BFUkFUT1IiLCJyb2xlIjoic2VjdXJpdHkifSx7InBhcnR5Um9sZSI6Ik9QRVJBVE9SIiwicm9sZSI6ImFwaSJ9XSwiZ3JvdXBzIjpbImludGVybmFsR3JvdXBJZC0xIiwiaW50ZXJuYWxHcm91cElkLTIiXX19.xPLX9D6khl4yCw5RDhsx9ZXJBJpSzol3HGs_FRKrCY4";

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
