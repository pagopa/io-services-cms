import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { createWebServer } from "../../index";
import { ReviewRequest } from "../../../generated/api/ReviewRequest";

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

const aServiceLifecycle = {
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

  describe("reviewService", () => {
    const payload: ReviewRequest = {
      auto_publish: true,
    };

    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .put("/api/services/s1/review")
        .send(payload)
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
    });

    it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
      serviceLifecycleStore.save("s1", {
        ...aServiceLifecycle,
        fsm: { state: "approved" },
      });

      const response = await request(app)
        .put("/api/services/s1/review")
        .send(payload)
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .put("/api/services/s1/review")
        .send(payload)
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });

    const serviceToSubmit: ServiceLifecycle.ItemType = {
      ...aServiceLifecycle,
      fsm: { state: "draft" },
    };

    it("should submit a service", async () => {
      serviceLifecycleStore.save("s1", serviceToSubmit);

      const response = await request(app)
        .put("/api/services/s1/review")
        .send(payload)
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      const serviceAfterApply = await serviceLifecycleStore.fetch("s1")();

      let optionValue: O.Option<ServiceLifecycle.ItemType> = O.none;

      expect(E.isRight(serviceAfterApply)).toBeTruthy();
      if (E.isRight(serviceAfterApply)) {
        optionValue = serviceAfterApply.right;
      }

      expect(O.isSome(optionValue)).toBeTruthy();
      if (O.isSome(optionValue)) {
        const finalValue = optionValue.value;
        expect(finalValue.fsm).toHaveProperty("autoPublish");
        expect(finalValue.fsm.autoPublish).toBeTruthy();
        expect(finalValue.fsm.state).toBe("submitted");
      }

      expect(response.statusCode).toBe(204);
    });
  });
});
