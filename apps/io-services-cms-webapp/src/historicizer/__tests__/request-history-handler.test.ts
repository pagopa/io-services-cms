import { describe, it, expect } from "vitest";
import { Context } from "@azure/functions";
import { Json } from "io-ts-types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { buildDocument, handleQueueItem } from "../request-history-handler";
import { ServiceLifecycle } from "@io-services-cms/models";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const atimestamp = 1685529694747;
const aService = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
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
  last_update: new Date(atimestamp).toISOString(),
} as unknown as ServiceLifecycle.definitions.Service;

const aQueueItem = aService as unknown as Json;
const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service History Handler", () => {
  it("[handleQueueItem] should return an Error if queueItem is invalid", async () => {
    const context = createContext();

    try {
      await handleQueueItem(context, anInvalidQueueItem)();
    } catch (error) {
      expect(error.message).toBeDefined();
    }
  });

  it("[handleQueueItem] should handle queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(context, aQueueItem)();

    expect(context.bindings.serviceHistoryDocument).toBe(
      buildDocument(aService)
    );
  });

  it("[buildDocument] should build document starting from a service", async () => {
    const result = buildDocument(aService);
    const resultObj = JSON.parse(result);

    expect(resultObj.id).toBe(atimestamp.toString());
    expect(resultObj.serviceId).toBe(aService.id);
  });
});
