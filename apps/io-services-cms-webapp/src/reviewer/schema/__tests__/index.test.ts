import { Client } from "pg";
import * as env from "./env";

const client = new Client({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: parseInt(env.DB_PORT)
});

beforeAll(async () => {
  await client.connect(err => {
    console.log(err);
  });
});

afterAll(async () => {
  await client.end();
});

const aRandomSubscriptionId = () => `a-sub-id-${Date.now()}`;

// Dummy insert for a given subscriptionId
const anInsertSQL = (subscriptionId: string) => `
    INSERT INTO "${env.DB_SCHEMA}"."${env.DB_TABLE}"(
        "id", "organizationFiscalCode", "version", "name", "isVisible", "requireSecureChannels", "authorizedCIDRS","subscriptionAccountId", "subscriptionAccountName", "subscriptionAccountSurname", "subscriptionAccountEmail")
        VALUES ('${subscriptionId}', '0000000000', 0, 'any name', false, false, '{ "ip": ["192.168.0.1/32", "192.168.1.1/32", "10.0.0.1/24"]}', 1, 'aName', 'aSurname','an@email.com')
`;

// Select one record by subscriptionId
const aSelectSQL = (subscriptionId: string) => `
   SELECT * FROM "${env.DB_SCHEMA}"."${env.DB_TABLE}" WHERE "id"='${subscriptionId}'
`;

// Select records by IPv4 Address
const aSelectSQLWithIPAddress = (anIPAddress: string) => `
   SELECT * FROM "${env.DB_SCHEMA}"."${env.DB_TABLE}" WHERE "authorizedCIDRS" ->> 'ip' like '%"${anIPAddress}"%'
`;

// Dummy update for a given subscriptionId
const anUpdateSQL = (subscriptionId: string) => `
    UPDATE "${env.DB_SCHEMA}"."${env.DB_TABLE}"
      SET "id"='${subscriptionId}', "version"=1
      WHERE  "id"='${subscriptionId}'
`;

const addService = async (): Promise<string> => {
  // Create a subscription ID
  const subscriptionId = aRandomSubscriptionId();

  // Insert a new subscription row
  await client.query(anInsertSQL(subscriptionId));

  return subscriptionId;
};

describe("Test on db", () => {
  it("should select the first row", async () => {
    const subscriptionId = await addService();

    const {
      rows: [{ id: subscriptionRetrieved }]
    } = await client.query(aSelectSQL(subscriptionId));

    expect(subscriptionRetrieved.trim()).toBe(subscriptionId.trim());
  });
});

describe("Query on IP Address", () => {
  it("should retrieve at least one record with a valid IP", async () => {
    await addService();
    const sql = aSelectSQLWithIPAddress("192.168.0.1/32");

    const res = await client.query(sql);

    expect(res.rowCount).toBeGreaterThan(0);
  });

  it("should update a new service from version 0 to version 1", async () => {
    const subscriptionId = await addService();
    const sql = anUpdateSQL(subscriptionId);
    await client.query(sql);
    const {
      rows: [{ version }]
    } = await client.query(aSelectSQL(subscriptionId));

    expect(version).toBe(1);
  });
});
