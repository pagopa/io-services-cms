import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import {
  getProductByName,
  getUserByEmail,
  upsertSubscription,
} from "../../../lib/clients/apim-client";
import { createWebServer } from "../../index";

vi.mock("../../../lib/clients/apim-client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClient = ServiceLifecycle.getFsmClient(serviceLifecycleStore);

const servicePublicationStore =
  stores.createMemoryStore<ServicePublication.ItemType>();
const fsmPublicationClient = ServicePublication.getFsmClient(
  servicePublicationStore
);

const mockApimClient = {} as unknown as ApiManagementClient;
const mockConfig = {
  SANDBOX_FISCAL_CODE: "AAAAAA00A00A000A",
} as unknown as IConfig;

describe("createService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    fsmLifecycleClient,
    fsmPublicationClient,
  });

  const aNewService = {
    name: "a service",
    description: "a description",
    organization: {
      name: "org",
      fiscal_code: "00000000000",
    },
    metadata: {
      scope: "LOCAL",
    },
    authorized_recipients: ["BBBBBB99C88D555I"],
  };

  it("should not accept invalid payloads", async () => {
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(400);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(403);
  });

  it("should create a draft service", async () => {
    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    console.log(`CREATE RESONSE: ${JSON.stringify(response.body)}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.status.value).toBe("draft");
    expect(response.body.id).toEqual(expect.any(String));
  });

  it("should fail when cannot find apim user", async () => {
    vi.mocked(getUserByEmail).mockImplementation(() =>
      TE.left({ statusCode: 500 })
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(500);
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot find apim product", async () => {
    vi.mocked(getProductByName).mockImplementation(() =>
      TE.left({ statusCode: 500 })
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(500);
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot create subscription", async () => {
    vi.mocked(upsertSubscription).mockImplementation(() =>
      TE.left({ statusCode: 500 })
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(500);
    expect(spied).not.toHaveBeenCalled();
  });
});
