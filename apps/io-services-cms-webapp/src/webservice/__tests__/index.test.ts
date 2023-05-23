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
import { IConfig } from "../../config";
import {
  getProductByName,
  getUserByEmail,
  upsertSubscription,
} from "../../lib/clients/apim-client";
import { createWebServer } from "../index";

vi.mock("../../lib/clients/apim-client", async () => {
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

const servicePublicationStore =
  stores.createMemoryStore<ServicePublication.ItemType>();

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
    servicePublicationStore,
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

  describe("reviewService", () => {
    const aService = {
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
    } as unknown as ServiceLifecycle.ItemType;

    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .put("/api/services/s1/review")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
    });

    it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
      serviceLifecycleStore.save("s1", {
        ...aService,
        fsm: { state: "approved" },
      });

      const response = await request(app)
        .put("/api/services/s1/review")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .put("/api/services/s1/review")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });

    it("should submit a service", async () => {
      serviceLifecycleStore.save("s1", {
        ...aService,
        fsm: { state: "draft" },
      });

      const response = await request(app)
        .put("/api/services/s1/review")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(204);
    });
  });

  const aService = {
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

  describe("publishService", () => {
    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .post("/api/services/s1/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
    });

    it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
      servicePublicationStore.save("s1", {
        ...aService,
        fsm: { state: "published" },
      });

      const response = await request(app)
        .post("/api/services/s1/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .post("/api/services/s1/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });

    it("should publish a service", async () => {
      servicePublicationStore.save("s1", {
        ...aService,
        fsm: { state: "unpublished" },
      });

      const response = await request(app)
        .post("/api/services/s1/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(204);
    });
  });

  describe("unPublishService", () => {
    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
    });

    it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
      servicePublicationStore.save("s2", {
        ...aService,
        fsm: { state: "unpublished" },
      });

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });

    it("should unpublish a service", async () => {
      servicePublicationStore.save("s2", {
        ...aService,
        fsm: { state: "published" },
      });

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(204);
    });
  });
});
