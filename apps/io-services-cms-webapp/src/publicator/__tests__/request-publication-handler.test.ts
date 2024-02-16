/* eslint-disable no-console */
import { Context } from "@azure/functions";
import {
  FsmItemNotFoundError,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    authorized_cidrs: [],
  },
} as unknown as ServiceLifecycle.definitions.Service;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Publication Handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("handleQueueItem should return an Error if queueItem is invalid", async () => {
    const context = createContext();

    const mockFsmPublicationClient =
      {} as unknown as ServicePublication.FsmClient;

    await expect(() =>
      handleQueueItem(context, anInvalidQueueItem, mockFsmPublicationClient)()
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("handleQueueItem should release and publish when autoPublish true", async () => {
    const autoPublishQueueItem = {
      ...aService,
      autoPublish: true,
      kind: "RequestPublicationItem",
    };
    const context = createContext();

    const mockFsmPublicationClient = {
      release: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "published" },
        })
      ),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      autoPublishQueueItem,
      mockFsmPublicationClient
    )();
    expect(mockFsmPublicationClient.release).toBeCalledTimes(1);
    expect(mockFsmPublicationClient.release).toBeCalledWith(
      aService.id,
      aService,
      autoPublishQueueItem.autoPublish
    );
  });

  it("handleQueueItem should release on autoPublish false", async () => {
    const autoPublishQueueItem = {
      ...aService,
      autoPublish: false,
      kind: "RequestPublicationItem",
    };
    const context = createContext();

    const mockFsmPublicationClient = {
      release: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "unpublished" },
        })
      ),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      autoPublishQueueItem as unknown as Json,
      mockFsmPublicationClient
    )();
    expect(mockFsmPublicationClient.release).toBeCalledTimes(1);
    const {} = aService;
    expect(mockFsmPublicationClient.release).toBeCalledWith(
      aService.id,
      aService,
      autoPublishQueueItem.autoPublish
    );
  });

  it("handleQueueItem should unpublish", async () => {
    const autoPublishQueueItem = {
      id: aService.id,
      kind: "RequestUnpublicationItem",
    } as unknown as Json;
    const context = createContext();

    const mockFsmPublicationClient = {
      unpublish: vi.fn(() =>
        TE.right({
          ...aService,
          fsm: { state: "unpublished" },
        })
      ),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      autoPublishQueueItem,
      mockFsmPublicationClient
    )();
    expect(mockFsmPublicationClient.unpublish).toBeCalledTimes(1);
    expect(mockFsmPublicationClient.unpublish).toBeCalledWith(aService.id);
  });

  it("handleQueueItem should be void 0 if unpublish return an FsmItemNotFoundError", async () => {
    const QueueItem = {
      id: aService.id,
      kind: "RequestUnpublicationItem",
    } as unknown as Json;
    const context = createContext();

    const notFound = new FsmItemNotFoundError("aErrorMessage");

    const mockFsmPublicationClient = {
      unpublish: vi.fn(() => TE.left(notFound)),
    } as unknown as ServicePublication.FsmClient;

    const result = await handleQueueItem(
      context,
      QueueItem,
      mockFsmPublicationClient
    )();
    expect(mockFsmPublicationClient.unpublish).toBeCalledTimes(1);
    expect(result).toBe(void 0);
  });
});
