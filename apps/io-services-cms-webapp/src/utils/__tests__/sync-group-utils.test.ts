import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  syncSubscription,
  GroupChangeEvent,
  syncServices,
} from "../sync-group-utils";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";

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
describe("sync group utils", () => {
  describe("syncSubscription", () => {
    const deps = {
      apimService: mocks.ApimService as unknown as ApimUtils.ApimService,
    };

    it.each`
      testOutput | failureCause                           | groupId      | error                               | expectedResult
      ${"Left"}  | ${"a generic error"}                   | ${"groupId"} | ${new Error("my error")}            | ${new Error("my error")}
      ${"Left"}  | ${"an API REST error object"}          | ${"groupId"} | ${{ statusCode: 500, details: {} }} | ${new Error(`Failed to update subcription groupId, reason: {}`)}
      ${"Right"} | ${"a Not Found API REST error object"} | ${"groupId"} | ${{ statusCode: 404 }}              | ${undefined}
    `(
      "should return $testOutput when getSubscription fail with $failureCause",
      async ({ testOutput, error, groupId, expectedResult }) => {
        // given
        const item = { productId: "prod-io", id: groupId } as GroupChangeEvent;
        mocks.ApimService.getSubscription.mockReturnValueOnce(TE.left(error));

        // when
        const result = await syncSubscription(deps.apimService)(item)();

        // then
        expect(result._tag === testOutput).toBeTruthy();
        const unionRes = E.toUnion(result);
        expect(unionRes).toStrictEqual(expectedResult);
        expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
        expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
        );
        expect(mocks.ApimService.updateSubscription).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario                                     | failureCase                            | itemParam              | expSubParam                | testOutput | error                               | expectedResult
      ${"subscription.displayName and group.name"} | ${"a generic error"}                   | ${{ name: "foo" }}     | ${{ displayName: "bar" }}  | ${"Left"}  | ${new Error("my error")}            | ${new Error("my error")}
      ${"subscription.state and group.status"}     | ${"an API REST error object"}          | ${{ state: "active" }} | ${{ status: "SUSPENDED" }} | ${"Left"}  | ${{ statusCode: 500, details: {} }} | ${new Error(`Failed to update subcription groupId, reason: {}`)}
      ${"subscription.state and group.status"}     | ${"a Not Found API REST error object"} | ${{ state: "active" }} | ${{ status: "DELETED" }}   | ${"Right"} | ${{ statusCode: 404 }}              | ${undefined}
    `(
      "should fail when there are changes between $scenario and updateSubscription fails with $failureCase",
      async ({ itemParam, expSubParam, testOutput, error, expectedResult }) => {
        // given
        const item = {
          productId: "prod-io",
          id: "groupId",
          name: "name",
          status: "ACTIVE",
          ...itemParam,
        } as GroupChangeEvent;
        const expectedSubscription = {
          name: "name",
          eTag: "eTag",
          state: "active",
          ...expSubParam,
        };
        mocks.ApimService.getSubscription.mockReturnValueOnce(
          TE.right(expectedSubscription),
        );
        mocks.ApimService.updateSubscription.mockReturnValueOnce(
          TE.left(error),
        );

        // when
        const result = await syncSubscription(deps.apimService)(item)();

        // then
        expect(result._tag === testOutput).toBeTruthy();
        const unionRes = E.toUnion(result);
        expect(unionRes).toStrictEqual(expectedResult);
        expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
        expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
        );
        expect(mocks.ApimService.updateSubscription).toHaveBeenCalledOnce();
        expect(mocks.ApimService.updateSubscription).toHaveBeenCalledWith(
          expectedSubscription.name,
          {
            displayName: item.name,
            state: "active",
          },
          expectedSubscription.eTag,
        );
      },
    );

    it("should complete successfully", async () => {
      //given
      const item = {
        productId: "prod-io",
        id: "groupId",
        name: "name",
        status: "ACTIVE",
      } as GroupChangeEvent;
      const expectedSubscription = {
        name: "name",
        eTag: "eTag",
        state: "active",
      };
      mocks.ApimService.getSubscription.mockReturnValueOnce(
        TE.right(expectedSubscription),
      );
      mocks.ApimService.updateSubscription.mockReturnValueOnce(
        TE.right(expectedSubscription),
      );
      // when
      const result = await syncSubscription(deps.apimService)(item)();

      // then
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBeUndefined();
      }
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledOnce();
      expect(mocks.ApimService.getSubscription).toHaveBeenCalledWith(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + item.id,
      );
      expect(mocks.ApimService.updateSubscription).toHaveBeenCalledOnce();
      expect(mocks.ApimService.updateSubscription).toHaveBeenCalledWith(
        expectedSubscription.name,
        {
          displayName: item.name,
          state: "active",
        },
        expectedSubscription.eTag,
      );
    });
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
      expect(mocks.LifecycleStore.bulkPatch).not.toHaveBeenCalledOnce();
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
});
