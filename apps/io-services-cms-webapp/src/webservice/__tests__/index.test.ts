import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { createWebServer } from "../index";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { IConfig } from "../../config";
//import { Service } from "@io-services-cms/models/service-lifecycle/types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  getUserByEmail,
  getProductByName,
  upsertSubscription,
} from "../../apim_client";

vi.mock("../../apim_client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

// memory implementation, for testing
const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();

const mockApimClient = {} as unknown as ApiManagementClient;
const mockConfig = {} as unknown as IConfig;

describe("WebService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    serviceLifecycleStore,
  });

  describe("createService", () => {
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
});
