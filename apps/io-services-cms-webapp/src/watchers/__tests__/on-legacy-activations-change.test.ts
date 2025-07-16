import { Activations, DateUtils } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeHandler } from "../on-legacy-activations-change";

const mocks = vi.hoisted(() => ({
  blobContainerClient: { uploadBlockBlob: vi.fn() },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("makeHandler", () => {
  const deps = {
    blobContainerClient: mocks.blobContainerClient,
  } as unknown as Parameters<typeof makeHandler>[0];
  const item = {
    fiscalCode: "fiscalCode",
    serviceId: "serviceId",
    status: "ACTIVE",
    _ts: 1234567890,
  } as Activations.LegacyCosmosResource;
  const mapToCmsSerializedItem = (legacy: Activations.LegacyCosmosResource) =>
    JSON.stringify({
      fiscalCode: legacy.fiscalCode,
      modifiedAt: DateUtils.unixSecondsToMillis(legacy._ts),
      serviceId: legacy.serviceId,
      status: legacy.status,
    });

  it("should fail when uploadBlockBlob fails", async () => {
    // given
    const error = new Error("uploadBlockBlob error");
    mocks.blobContainerClient.uploadBlockBlob.mockRejectedValueOnce(error);

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(mocks.blobContainerClient.uploadBlockBlob).toHaveBeenCalledOnce();
    const cmsSerializedItem = mapToCmsSerializedItem(item);
    expect(mocks.blobContainerClient.uploadBlockBlob).toHaveBeenCalledWith(
      item.fiscalCode + "/" + item.serviceId + ".json",
      cmsSerializedItem,
      Buffer.byteLength(cmsSerializedItem),
      { tags: { fiscalCode: item.fiscalCode } },
    );
  });

  it("should complete successfully when uploadBlockBlob do not fail", async () => {
    // given
    mocks.blobContainerClient.uploadBlockBlob.mockResolvedValueOnce("result");

    // when
    const result = await makeHandler(deps)({ item })();

    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.blobContainerClient.uploadBlockBlob).toHaveBeenCalledOnce();
    const cmsSerializedItem = mapToCmsSerializedItem(item);
    expect(mocks.blobContainerClient.uploadBlockBlob).toHaveBeenCalledWith(
      item.fiscalCode + "/" + item.serviceId + ".json",
      cmsSerializedItem,
      Buffer.byteLength(cmsSerializedItem),
      { tags: { fiscalCode: item.fiscalCode } },
    );
  });
});
