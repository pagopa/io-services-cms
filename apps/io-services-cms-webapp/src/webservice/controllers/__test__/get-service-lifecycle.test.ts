import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
    ServiceLifecycle,
    ServicePublication,
    stores,
} from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { IConfig } from "../../../config";
import { itemToResponse as getLifecycleItemToResponse } from "../../../utils/converters/service-lifecycle-converters";
import { createWebServer } from "../../index";

// memory implementation, for testing
const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();

const servicePublicationStore =
  stores.createMemoryStore<ServicePublication.ItemType>();

const mockApimClient = {} as unknown as ApiManagementClient;
const mockConfig = {} as unknown as IConfig;

describe("getServiceLifecycle", () => {
  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    serviceLifecycleStore,
    servicePublicationStore,
  });

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

  it("should fail when cannot find requested service", async () => {
    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(404); // FIXME: should be 404 (or 409)
  });

  const asServiceLifecycleWithStatus = {
    ...aServiceLifecycle,
    fsm: { state: "published" },
  } as unknown as ServiceLifecycle.ItemType;

  it("should retrieve a service", async () => {
    serviceLifecycleStore.save("s12", asServiceLifecycleWithStatus);

    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify(getLifecycleItemToResponse(asServiceLifecycleWithStatus))
    );
    expect(response.statusCode).toBe(200);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(403);
  });
});
