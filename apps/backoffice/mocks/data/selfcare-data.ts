import { faker } from "@faker-js/faker/locale/it";

export const aMockedIdentityToken =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ0OjFkOjhjOmQ5OjhmOjAwOmIyOjA0OmU5OjgwOjA5Ojk4OmVjOmY4OjQyOjdlIiwidHlwIjoiSldUIn0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwib3JnYW5pemF0aW9uIjp7ImlkIjoiNzRkYWVmZGEtN2U3Mi00NmUyLTgxNWEtYjI2ZDNiZjk4OTg4IiwibmFtZSI6IkNvbXVuZSBkaSBDaXN0ZXJuaW5vIiwicm9sZXMiOlt7InBhcnR5Um9sZSI6IkRFTEVHQVRFIiwicm9sZSI6ImFkbWluIn1dLCJzdWJVbml0Q29kZSI6bnVsbCwic3ViVW5pdFR5cGUiOiJFQyIsImFvb1BhcmVudCI6bnVsbCwicGFyZW50RGVzY3JpcHRpb24iOm51bGwsInJvb3RQYXJlbnQiOnsiaWQiOm51bGwsImRlc2NyaXB0aW9uIjpudWxsfSwiZmlzY2FsX2NvZGUiOiI4MTAwMTQ3MDc0OSIsImlwYUNvZGUiOiJjX2M3NDEifSwiZGVzaXJlZF9leHAiOjE2OTY1NDM3NzMsImlhdCI6MTY5NjUxMTQyNSwiZXhwIjoxNzk2NTExNDQwLCJhdWQiOiJsb2NhbGhvc3QiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAvbW9ja3Mvc2VsZmNhcmUiLCJqdGkiOiI1MjIxNjk5Mi02NzBhLTQ1M2ItYWE1Zi1lODZiNGRjNzhjN2EifQ.a1-DnE9z9Q9bk_4cuk1_dbs6UDJDE1Ky70W58huz1_HrZeZzLtlSDYyv5h_7vxf9uT_PBSyzF6sSXdBg2GR7vqZyQJu29wJn5Tk--W1LTBg85mKbHzPScAUU_46Bjq8dTM9ZALHoWjkyP6D6ToSxsj6pzxDuP2i_1GU0T5EJRz7HzR5EOnG459ADY1n9wdeWVP-KGUQCXRgtkpKXMMz9RIGIIYLqk0qLCnW1QhuvjsvRqwbS5P21kWSHZBICCbJSU6DVAS5SDNEHGVbm6-eIDS2I0hMTcLtQUB5ZxDnQvzQMmLSWa8febF6WfvxXVdcH4kavdxuVf2J9gHnMefph6A";
export const aMockedChangeInstitutionIdentityToken =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ0OjFkOjhjOmQ5OjhmOjAwOmIyOjA0OmU5OjgwOjA5Ojk4OmVjOmY4OjQyOjdlIiwidHlwIjoiSldUIn0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwib3JnYW5pemF0aW9uIjp7ImlkIjoiNzRkYWVmZGEtN2U3Mi00NmUyLTgxNWEtYjI2ZDNiZjk4OTg5IiwibmFtZSI6IkNvbXVuZSBkaSBSb21hIiwicm9sZXMiOlt7InBhcnR5Um9sZSI6IkRFTEVHQVRFIiwicm9sZSI6Im9wZXJhdG9yIn1dLCJzdWJVbml0Q29kZSI6bnVsbCwic3ViVW5pdFR5cGUiOiJFQyIsImFvb1BhcmVudCI6bnVsbCwicGFyZW50RGVzY3JpcHRpb24iOm51bGwsInJvb3RQYXJlbnQiOnsiaWQiOm51bGwsImRlc2NyaXB0aW9uIjpudWxsfSwiZmlzY2FsX2NvZGUiOiI4MTAwMTQ3MDc0MCIsImlwYUNvZGUiOiJjX2M3NDIifSwiZGVzaXJlZF9leHAiOjE2OTY1NDM3NzMsImlhdCI6MTY5NjUxMTQyNSwiZXhwIjoxNzk2NTExNDQwLCJhdWQiOiJsb2NhbGhvc3QiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAvbW9ja3Mvc2VsZmNhcmUiLCJqdGkiOiI1MjIxNjk5Mi02NzBhLTQ1M2ItYWE1Zi1lODZiNGRjNzhjN2EifQ.lubP72LeF-_-3EwbjQz1P1sxd4RFdcVmMIMwVTtI3tamXiNjSXjYPxuM2vgzOgAQ-yZQObdqjQLHJsg_DOvAh6iOnOoGzQDZ0ciGQqffEkwNj5BnVDBsITnDh9FKhnKm7p12N1rqbSuERhiQM3-uMxas2syM-oPX_xc__9JGkhjXgbsHK_gy8Jk-1ldN66vC6oQiYxrc_WxqiCwut4u8uM-_Dw9X5rze_UGdhay9mrrZDpqKAVZkKl3sAGZGcJq3LFJMqier9H_t6KbVQuBee8T2Xr1xBNZ-qIkbwOR_u-TKseTxYauJeWSjXVOXdDYtAY8_oSCD2zTosd3C2M4EOw";
export const aMockedAggregatorInstitutionIdentityToken =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ0OjFkOjhjOmQ5OjhmOjAwOmIyOjA0OmU5OjgwOjA5Ojk4OmVjOmY4OjQyOjdlIiwidHlwIjoiSldUIn0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwib3JnYW5pemF0aW9uIjp7ImlkIjoiNzRnZHBmZGEtN2U3Mi00NmUyLTgxNWEtYjI2ZDNiZjk4MTIzIiwibmFtZSI6IkNvbXVuZSBkaSBCYXJpIiwicm9sZXMiOlt7InBhcnR5Um9sZSI6IkRFTEVHQVRFIiwicm9sZSI6ImFkbWluX2FnZ3JlZ2F0b3IifV0sInN1YlVuaXRDb2RlIjpudWxsLCJzdWJVbml0VHlwZSI6IkVDIiwiYW9vUGFyZW50IjpudWxsLCJwYXJlbnREZXNjcmlwdGlvbiI6bnVsbCwicm9vdFBhcmVudCI6eyJpZCI6bnVsbCwiZGVzY3JpcHRpb24iOm51bGx9LCJmaXNjYWxfY29kZSI6IjgxMDAxNDcwNzQ5IiwiaXBhQ29kZSI6ImNfYzc0MSJ9LCJkZXNpcmVkX2V4cCI6MTY5NjU0Mzc3MywiaWF0IjoxNjk2NTExNDI1LCJleHAiOjE3OTY1MTE0NDAsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9tb2Nrcy9zZWxmY2FyZSIsImp0aSI6IjUyMjE2OTkyLTY3MGEtNDUzYi1hYTVmLWU4NmI0ZGM3OGM3YSJ9.CSlAvhW_LKeNK6Kj8jeKf0D2vUfE7GQ5nHUT7splM947b1JTLeW86PfuN-PbrhrpdDJZnXh7B7zWKzh5TJtC9l1dpfHYt5WYP17Plwo4Hfd5-CpnOirS508tBfCEgqyebciN835OTWWUs4ZFXlsedhmsXsvjrKc3eeFIw7QleeOSc4_DNHI88vHfv615M10HO6p5cwKyujqtKsIZ4UhzpLnyKmNFC385roDEZRD1SsF1I3OWBeVoQHrYGATiOWQYSHL3R5Cven8yiNugqNbPSSP3BsGh7EBRBN9yGJeaJBXw1lXRunN0SPTeTvL6vcHXvdlR7p3S7olf0Sybn1a5Mw";
export const aMockedAggregatorInstitutionOperatorIdentityToken =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ0OjFkOjhjOmQ5OjhmOjAwOmIyOjA0OmU5OjgwOjA5Ojk4OmVjOmY4OjQyOjdlIiwidHlwIjoiSldUIn0.eyJlbWFpbCI6Im0uY3VyaWVAdGVzdC5lbWFpbC5pdCIsImZhbWlseV9uYW1lIjoiQ3VyaWUiLCJmaXNjYWxfbnVtYmVyIjoiQ1JVTVJBNzZTNThBOTQ0ViIsIm5hbWUiOiJNYXJpZSIsImZyb21fYWEiOmZhbHNlLCJ1aWQiOiIyYjEwODUyZi1hNGZkLTRhZTgtOWRmYy1hYzM1NzhmYzViMjEiLCJsZXZlbCI6IkwyIiwib3JnYW5pemF0aW9uIjp7ImlkIjoiNzRnZHBmZGEtN2U3Mi00NmUyLTgxNWEtYjI2ZDNiZjk4MTIzIiwibmFtZSI6IkNvbXVuZSBkaSBCYXJpIiwicm9sZXMiOlt7InBhcnR5Um9sZSI6IkRFTEVHQVRFIiwicm9sZSI6Im9wZXJhdG9yIn1dLCJzdWJVbml0Q29kZSI6bnVsbCwic3ViVW5pdFR5cGUiOiJFQyIsImFvb1BhcmVudCI6bnVsbCwicGFyZW50RGVzY3JpcHRpb24iOm51bGwsInJvb3RQYXJlbnQiOnsiaWQiOm51bGwsImRlc2NyaXB0aW9uIjpudWxsfSwiZmlzY2FsX2NvZGUiOiI4MTAwMTQ3MDc0OSIsImlwYUNvZGUiOiJjX2M3NDEiLCJncm91cHMiOlsiYWJjMTIzIl19LCJkZXNpcmVkX2V4cCI6MTY5NjU0Mzc3MywiaWF0IjoxNjk2NTExNDI1LCJleHAiOjE3OTY1MTE0NDAsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9tb2Nrcy9zZWxmY2FyZSIsImp0aSI6IjUyMjE2OTkyLTY3MGEtNDUzYi1hYTVmLWU4NmI0ZGM3OGM3YSJ9.XzNKECifzcL6E1zxYuJ57Hf4VNFQ0GZxouptD0tJghhF4-zgTqb5GOVe9w5t8PpqJBYlLClty51qe1CiU7LbuTu6LAcYZPgEpzZoFelyKkxLS4z4MWBEoD0e4X4oVna9usQZ-LUVGLSuHQ0mpJeJ_yyATDIHgOSXZAvlqaE-x-o641NAu8VFond7gElKj5NkDzHGXFJ3YKlEn-2eoZ8PXFVQBPLGhnGHr0Nl3lvlT44wKmnxkJmZVDPedE7L2ounmWCmF2-JihIKrVjjikmfp1XUNQY4_K8evo0xB5XC8n0Ogwcaq7MxJHskIM_WENsTLh4QMf_9IP47OxMN4ED99A";

/** `institutionId` used in `aMockedAggregatorInstitutionIdentiyToken` */
const aMockedAggregatorInstitutionId = "74gdpfda-7e72-46e2-815a-b26d3bf98123";

export const aWellKnown = {
  keys: [
    {
      alg: "RS256",
      e: "AQAB",
      kid: "d4:1d:8c:d9:8f:00:b2:04:e9:80:09:98:ec:f8:42:7e",
      kty: "RSA",
      n: "yoyrLiHg-sPgFUBfrp2mrnOmsw61qmU920E102tdRdyuDSSxxa1dnqC8BbeQWksLPZ2glUSUNR0BkrrsL3jO2WcOIDXs0FnJog018fyxkJfXJOp0Oyrh7Ei4WiZaPbXe7PBVOYhoVbcPJAJb17VHg5rZQwROLL3Umwk2x_fDCAFUUImbZKDLr68Onj7cC3H1_4pvdwyqph7ThVDx42EYupTe8W2kOzmli2eNQ14czAL2kZI3PFL_xebMFbBkR0HW6xorH9WjzFpVkbwy98DjsmIw7_XLfNIRJuSNrHpVMYTwbdh3DrHOwDbg2XGsgdtLdf4oDuViVv0wFucocI3mFw",
      use: "sig",
    },
  ],
};

export const aMockCurrentUserAuthorizedInstitution = {
  id: "74daefda-7e72-46e2-815a-b26d3bf98988",
  logo_url: "",
  name: "Comune di Cisternino",
  role: "admin",
};

export const getMockUserAuthorizedInstitution = () => ({
  id: faker.string.uuid(),
  logo_url: "",
  name: faker.company.name(),
  role: faker.helpers.arrayElement(["admin", "operator"]),
});

export const getMockUserInstitution = (userId?: string) => ({
  id: faker.string.uuid(),
  institutionDescription: faker.company.name(),
  institutionId: faker.string.uuid(),
  institutionRootName: faker.company.name(),
  logo: faker.image.url(),
  products: [
    {
      createdAt: faker.date.past().toISOString(),
      env: "ROOT",
      productId: faker.string.alphanumeric({ length: { max: 10, min: 5 } }),
      productRole: faker.helpers.arrayElement(["admin", "operator"]),
      role: "SUB_DELEGATE",
      status: "ACTIVE",
    },
  ],
  userId: userId ?? faker.string.uuid(),
  userMailUuid: faker.string.uuid(),
});

export const getMockInstitution = (institutionId?: string) => ({
  address: faker.location.streetAddress(true),
  aooParentCode: faker.string.numeric(5),
  attributes: [
    {
      code: faker.lorem.slug(1),
      description: faker.lorem.slug(1),
      origin: faker.lorem.slug(1),
    },
  ],
  businessRegisterPlace: faker.lorem.slug(1),
  dataProtectionOfficer: {
    address: faker.location.streetAddress(true),
    email: faker.internet.email(),
    pec: faker.internet.email(),
  },
  description: faker.company.name(),
  digitalAddress: faker.internet.email(),
  externalId: faker.string.numeric(11),
  geographicTaxonomies: [
    {
      code: faker.location.countryCode(),
      desc: faker.location.state(),
    },
    {
      code: faker.location.countryCode(),
      desc: faker.location.state(),
    },
  ],
  id: institutionId ?? faker.string.uuid(),
  imported: faker.datatype.boolean(),
  institutionType: faker.helpers.arrayElement([
    "GSP",
    "PA",
    "PG",
    "PSP",
    "PT",
    "SCP",
    "SA",
  ]),
  logo: faker.image.url(),
  onboarding: [
    {
      isAggregator: institutionId === aMockedAggregatorInstitutionId,
      productId: "prod-io",
      status: "ACTIVE",
    },
  ],
  origin: "SELC",
  originId: faker.string
    .alphanumeric({ length: { max: 10, min: 5 } })
    .toUpperCase(),
  paymentServiceProvider: {
    abiCode: faker.string.numeric(5),
    businessRegisterNumber: faker.string.numeric(10),
    legalRegisterName: faker.company.name(),
    legalRegisterNumber: faker.string.numeric(8),
    vatNumberGroup: faker.datatype.boolean(),
  },
  rea: faker.lorem.slug(1),
  rootParent: {
    description: faker.company.name(),
    id: faker.string.uuid(),
  },
  shareCapital: faker.lorem.slug(1),
  subunitCode: faker.string.numeric(5),
  subunitType: faker.lorem.slug(1),
  supportEmail: faker.internet.email(),
  supportPhone: faker.phone.number(),
  taxCode: faker.string.numeric(11),
  zipCode: faker.location.zipCode(),
});

export const getSelfCareProblemResponse = (status: number) => ({
  detail: faker.lorem.slug(5),
  instance: faker.lorem.slug(1),
  invalidParams: [
    {
      name: faker.lorem.slug(1),
      reason: faker.lorem.slug(1),
    },
  ],
  status,
  title: faker.lorem.slug(5),
  type: faker.lorem.slug(1),
});

export const getMockInstitutionProducts = (_institutionId?: string) => {
  const product = {
    contractTemplatePath: "path/to/contractTemplatePath",
    contractTemplateVersion: "1.0.0",
    createdAt: new Date("2019-08-24T14:15:22Z"),
    depictImageUrl: "https://depictImageUrl",
    description: "product IO",
    id: "prod-io",
    identityTokenAudience: "identityTokenAudience",
    logo: "https://logo",
    logoBgColor: "logoBgColor",
    parentId: "parentId",
    roleManagementURL: "https://roleManagementURL",
    roleMappings: {
      property1: {
        multiroleAllowed: true,
        phasesAdditionAllowed: ["phase1"],
        roles: [
          {
            code: "code1",
            description: "description1",
            label: "label1",
            productLabel: "productLabel1",
          },
        ],
        skipUserCreation: true,
      },
      property2: {
        multiroleAllowed: true,
        phasesAdditionAllowed: ["phase2"],
        roles: [
          {
            code: "code2",
            description: "description2",
            label: "label2",
            productLabel: "productLabel2",
          },
        ],
        skipUserCreation: true,
      },
    },
    title: "IO",
    urlBO: "urlBO",
    urlPublic: "urlPublic",
  };

  type ObjectProduct = typeof product; //typing created to avoid warnings on any

  const createOtherProducts = (obj: ObjectProduct): ObjectProduct[] => {
    // To avoid writing n blocks of products, this allows random generation of 1 to 5 products.
    const count = faker.number.int({ max: 5, min: 1 });
    const products: ObjectProduct[] = [];

    for (let index = 1; index <= count; index++) {
      products.push({
        ...obj,
        description: `product ${index}`,
        id: `prod-${index}`,
        title: `product title ${index}`,
      });
    }
    return products;
  };

  return [product, ...createOtherProducts(product)];
};

export const getMockInstitutionGroups = (_institutionId?: string) => ({
  content: Array.from(Array(faker.number.int({ max: 10, min: 1 }))).map(
    (_value, _index, _array) => ({
      description: faker.lorem.slug(1),
      id: faker.string.uuid(),
      institutionId: _institutionId ?? faker.string.uuid(),
      name: "institutionGroupsName",
      productId: "prod-io",
      status: "ACTIVE",
    }),
  ),
  number: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
});
