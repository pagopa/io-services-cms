import { faker } from "@faker-js/faker/locale/it";

const MAX_ARRAY_LENGTH = 20;

export const aMockedIdentiyToken =
  "eyJraWQiOiJkNDoxZDo4YzpkOTo4ZjowMDpiMjowNDplOTo4MDowOTo5ODplYzpmODo0Mjo3ZSIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwiaWF0IjoxNjk2NTExNDI1LCJleHAiOjE3OTY1MTE0NDAsImF1ZCI6ImFwaS5pby5zZWxmY2FyZS5wYWdvcGEuaXQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcwNzUiLCJqdGkiOiI1MjIxNjk5Mi02NzBhLTQ1M2ItYWE1Zi1lODZiNGRjNzhjN2EiLCJvcmdhbml6YXRpb24iOnsiaWQiOiI3NGRhZWZkYS03ZTcyLTQ2ZTItODE1YS1iMjZkM2JmOTg5ODgiLCJuYW1lIjoiQ29tdW5lIGRpIENpc3Rlcm5pbm8iLCJyb2xlcyI6W3sicGFydHlSb2xlIjoiREVMRUdBVEUiLCJyb2xlIjoiYWRtaW4ifV0sInN1YlVuaXRDb2RlIjpudWxsLCJzdWJVbml0VHlwZSI6IkVDIiwiYW9vUGFyZW50IjpudWxsLCJwYXJlbnREZXNjcmlwdGlvbiI6bnVsbCwicm9vdFBhcmVudCI6eyJpZCI6bnVsbCwiZGVzY3JpcHRpb24iOm51bGx9LCJmaXNjYWxfY29kZSI6IjgxMDAxNDcwNzQ5IiwiaXBhQ29kZSI6ImNfYzc0MSJ9LCJkZXNpcmVkX2V4cCI6MTY5NjU0Mzc3M30.n1YUii4k951IWx1eCA8vAKT3q61uI-wMpnKkSTg95AoDtjH8lzxiIo6-Bew__WMgxLwXQVROe9vJM6aubkF8P05wTff5sZTEKeIEbDLddjKAjZVzY3EF7vpoSC6RKE_Vmp_D7Kt8DyzfyzbB_pGVOE6i0ZOqjNHdPh4A_TrEqTIRRBlk8pZ1FiNba_QRzJB1T7vmC6w8xyXlKppAFb03MgBr0zntIaS8gfXHXJBvMJN5cPwvgQ8NUbCPeBazJe8ENAHie1930xCsUt7NPAtbA_Baja5MEi6315B1syKHgewOB01C44K0LDuEKWY7cAlwR0hvkshyQYlGKBRfizPLHw";

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
