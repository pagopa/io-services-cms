import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupChangeEvent, syncServices, syncSubscription } from "..";

const mocks = vi.hoisted(() => ({
  ApimService: { getSubscription: vi.fn(), updateSubscription: vi.fn() },
  LifecycleStore: {
    executeOnServicesFilteredByGroupId: vi.fn(),
    bulkPatch: vi.fn(),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("syncServices", () => {
  const deps = {
    serviceLifecycleStore:
      mocks.LifecycleStore as unknown as ServiceLifecycle.LifecycleStore,
  };
  it("should complete successfully but do nothing when status is different from DELETED", async () => {
    //given
    const item = {
      productId: "prod-io",
      id: "groupId",
      name: "name",
      status: "ACTIVE",
    } as GroupChangeEvent;

    //when
    const result = await syncServices(deps.serviceLifecycleStore)(item)();

    //then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).not.toHaveBeenCalled();
    expect(mocks.LifecycleStore.bulkPatch).not.toHaveBeenCalled();
  });

  it("should fail when status is DELETED and executeOnServicesFilteredByGroupId fails", async () => {
    //given
    const groupId = "groupId";
    const item = {
      productId: "prod-io",
      id: groupId,
      name: "name",
      status: "DELETED",
    } as GroupChangeEvent;
    const error = new Error("error on executeOnServicesFilteredByGroupId");
    mocks.LifecycleStore.executeOnServicesFilteredByGroupId.mockReturnValueOnce(
      TE.left(error),
    );

    //when
    const result = await syncServices(deps.serviceLifecycleStore)(item)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledWith(groupId, expect.any(Function));
    expect(mocks.LifecycleStore.bulkPatch).not.toHaveBeenCalled();
  });

  it("should fail when status is DELETED and bulkPatch fails", async () => {
    //given
    const groupId = "groupId";
    const item = {
      productId: "prod-io",
      id: groupId,
      name: "name",
      status: "DELETED",
    } as GroupChangeEvent;
    const serviceIds = ["service1", "service2"];
    const expectedBulkPatchInput = serviceIds.map((sid) => ({
      data: {
        metadata: {
          group_id: undefined,
        },
      },
      id: sid,
    }));
    const error = new Error("error on bulkPatch");
    mocks.LifecycleStore.executeOnServicesFilteredByGroupId.mockImplementationOnce(
      (_groupId, callback) => {
        return callback(serviceIds);
      },
    );

    mocks.LifecycleStore.bulkPatch.mockReturnValueOnce(TE.left(error));

    //when
    const result = await syncServices(deps.serviceLifecycleStore)(item)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledWith(groupId, expect.any(Function));
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledOnce();
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledWith(
      expectedBulkPatchInput,
    );
  });

  it("should fail when status is DELETED and at least one of the bulkPatch operation has status different from 200", async () => {
    //given
    const groupId = "groupId";
    const item = {
      productId: "prod-io",
      id: groupId,
      name: "name",
      status: "DELETED",
    } as GroupChangeEvent;
    const serviceIds = ["service1", "service2"];
    const expectedBulkPatchInput = serviceIds.map((sid) => ({
      data: {
        metadata: {
          group_id: undefined,
        },
      },
      id: sid,
    }));
    mocks.LifecycleStore.executeOnServicesFilteredByGroupId.mockImplementationOnce(
      (_groupId, callback) => {
        return callback(serviceIds);
      },
    );
    mocks.LifecycleStore.bulkPatch.mockReturnValueOnce(
      TE.right(
        expectedBulkPatchInput.map((_) => ({
          statusCode: 200,
          requestCharge: 1,
        })),
      ),
    );

    //when
    const result = await syncServices(deps.serviceLifecycleStore)(item)();

    //then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledWith(groupId, expect.any(Function));
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledOnce();
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledWith(
      expectedBulkPatchInput,
    );
  });

  it("should complete successfully", async () => {
    //given
    const groupId = "groupId";
    const item = {
      productId: "prod-io",
      id: groupId,
      name: "name",
      status: "DELETED",
    } as GroupChangeEvent;
    const serviceIds = ["service1", "service2"];
    const expectedBulkPatchInput = serviceIds.map((sid) => ({
      data: {
        metadata: {
          group_id: undefined,
        },
      },
      id: sid,
    }));
    const error = new Error("At least one patch operation failed");
    mocks.LifecycleStore.executeOnServicesFilteredByGroupId.mockImplementationOnce(
      (_groupId, callback) => {
        return callback(serviceIds);
      },
    );
    mocks.LifecycleStore.bulkPatch.mockReturnValueOnce(
      TE.right(
        expectedBulkPatchInput.map((_, i) => ({
          statusCode: i === 0 ? 200 : 500,
          requestCharge: 1,
        })),
      ),
    );

    //when
    const result = await syncServices(deps.serviceLifecycleStore)(item)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledOnce();
    expect(
      mocks.LifecycleStore.executeOnServicesFilteredByGroupId,
    ).toHaveBeenCalledWith(groupId, expect.any(Function));
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledOnce();
    expect(mocks.LifecycleStore.bulkPatch).toHaveBeenCalledWith(
      expectedBulkPatchInput,
    );
  });
});
