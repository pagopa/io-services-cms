/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Json } from "io-ts-types";
import { describe, expect, it, vi, afterEach } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { handleQueueItem } from "../request-publication-handler";

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
} as unknown as ServiceLifecycle.definitions.Service;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Historicization Handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("handleQueueItem should return an Error if queueItem is invalid", async () => {
    const context = createContext();

    const mockFsmLifecycleClient =
      {} as unknown as ServicePublication.FsmClient;

    try {
      await handleQueueItem(
        context,
        anInvalidQueueItem,
        mockFsmLifecycleClient
      )();
    } catch (error) {
      expect(error).toHaveProperty("message");
    }
  });

  it("handleQueueItem should publish on autoPublish true", async () => {
    const autoPublishQueueItem = {
      ...aService,
      autoPublish: true,
    } as unknown as Json;
    const context = createContext();

    const mockFsmLifecycleClient = {
      override: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "unpublished" },
        })
      ),
      publish: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "published" },
        })
      ),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      autoPublishQueueItem,
      mockFsmLifecycleClient
    )();
    expect(mockFsmLifecycleClient.publish).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.publish).toBeCalledWith(aService.id, {
      data: aService,
    });
  });

  it("handleQueueItem should publish on autoPublish false", async () => {
    const autoPublishQueueItem = {
      ...aService,
      autoPublish: false,
    } as unknown as Json;
    const context = createContext();

    const mockFsmLifecycleClient = {
      override: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "unpublished" },
        })
      ),
      publish: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "published" },
        })
      ),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      autoPublishQueueItem,
      mockFsmLifecycleClient
    )();
    expect(mockFsmLifecycleClient.override).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.override).toBeCalledWith(aService.id, {
      data: aService,
    });
  });
});
