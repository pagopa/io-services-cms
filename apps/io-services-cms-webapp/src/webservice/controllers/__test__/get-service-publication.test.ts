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
import { itemToResponse as getPublicationItemToResponse } from "../../../utils/converters/service-publication-converters";
import { createWebServer } from "../../index";

vi.mock("../../lib/clients/apim-client", async () => {
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
const mockConfig = {} as unknown as IConfig;

const aServicePub = {
  id: "aServiceId",
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
} as unknown as ServicePublication.ItemType;

describe("WebService", () => {
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

  describe("getServicePublication", () => {
    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .get("/api/services/s3/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(404);
    });

    const asServiceWithStatus = {
      ...aServicePub,
      fsm: { state: "published" },
    } as unknown as ServicePublication.ItemType;

    it("should retrieve a service", async () => {
      await servicePublicationStore.save("s3", asServiceWithStatus)();

      const response = await request(app)
        .get("/api/services/s3/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(JSON.stringify(response.body)).toBe(
        JSON.stringify(getPublicationItemToResponse(asServiceWithStatus))
      );
      expect(response.statusCode).toBe(200);
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .get("/api/services/s3/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });
  });
});
