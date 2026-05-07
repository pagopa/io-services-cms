import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleGroupChangeEvent } from "../handle-group-change-event";
import { GroupChangeEvent } from "../types";

const mocks = vi.hoisted(() => ({
  createSubscriptionForGroup: vi.fn(),
  syncSubscription: vi.fn(),
  syncServices: vi.fn(),
  createSubscriptionForGroupTask: vi.fn(),
  syncSubscriptionTask: vi.fn(),
  syncServicesTask: vi.fn(),
  SelfcareUtils: {
    getSelfcareClient: vi.fn().mockReturnValue({}),
  },
  apimUserGroups: ["apigroup1", "apigroup2"],
}));

vi.mock("../create-manage-group-subscription", () => ({
  createSubscriptionForGroup: mocks.createSubscriptionForGroup,
}));

vi.mock("../sync-subscription", () => ({
  syncSubscription: mocks.syncSubscription,
}));

vi.mock("../sync-services", () => ({
  syncServices: mocks.syncServices,
}));

beforeEach(() => {
  vi.restoreAllMocks();

  mocks.createSubscriptionForGroup.mockImplementation(
    () => mocks.createSubscriptionForGroupTask,
  );
  mocks.syncSubscription.mockImplementation(() => mocks.syncSubscriptionTask);
  mocks.syncServices.mockImplementation(() => mocks.syncServicesTask);

  mocks.createSubscriptionForGroupTask.mockReturnValue(TE.right(void 0));
  mocks.syncSubscriptionTask.mockReturnValue(TE.right(void 0));
  mocks.syncServicesTask.mockReturnValue(TE.right(void 0));
});

describe("handleGroupChangeEvent", () => {
  const apimService = {} as ApimUtils.ApimService;
  const serviceLifecycleStore = {} as ServiceLifecycle.LifecycleStore;

  it("should do nothing when productId is not prod-io", async () => {
    const item = {
      productId: "prod-other",
      id: "group-id",
      name: "group-name",
      status: "ACTIVE",
    } as GroupChangeEvent;

    const result = await handleGroupChangeEvent({
      apimService,
      serviceLifecycleStore,
      selfcareClient: mocks.SelfcareUtils.getSelfcareClient(),
      apimUserGroups: mocks.apimUserGroups,
    })(item)();

    expect(result).toEqual(E.right(void 0));

    expect(mocks.createSubscriptionForGroup).not.toHaveBeenCalled();
    expect(mocks.syncSubscription).not.toHaveBeenCalled();
    expect(mocks.syncServices).not.toHaveBeenCalled();
  });

  it("should run all tasks when productId is prod-io", async () => {
    const item = {
      productId: "prod-io",
      id: "group-id",
      name: "group-name",
      status: "ACTIVE",
    } as GroupChangeEvent;

    const result = await handleGroupChangeEvent({
      apimService,
      serviceLifecycleStore,
      selfcareClient: mocks.SelfcareUtils.getSelfcareClient(),
      apimUserGroups: mocks.apimUserGroups,
    })(item)();

    expect(result).toEqual(E.right(void 0));

    expect(mocks.createSubscriptionForGroup).toHaveBeenCalledExactlyOnceWith(
      apimService,
      mocks.SelfcareUtils.getSelfcareClient(),
      mocks.apimUserGroups,
    );
    expect(
      mocks.createSubscriptionForGroupTask,
    ).toHaveBeenCalledExactlyOnceWith(item);

    expect(mocks.syncSubscription).toHaveBeenCalledExactlyOnceWith(apimService);
    expect(mocks.syncSubscriptionTask).toHaveBeenCalledExactlyOnceWith(item);

    expect(mocks.syncServices).toHaveBeenCalledExactlyOnceWith(
      serviceLifecycleStore,
    );
    expect(mocks.syncServicesTask).toHaveBeenCalledExactlyOnceWith(item);
  });

  it("should return the first error from the task sequence", async () => {
    const item = {
      productId: "prod-io",
      id: "group-id",
      name: "group-name",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const expectedError = new Error("sync subscription error");
    const anotherError = new Error("sync services error");

    mocks.syncSubscriptionTask.mockReturnValueOnce(TE.left(expectedError));
    mocks.syncServicesTask.mockReturnValueOnce(TE.left(anotherError));

    const result = await handleGroupChangeEvent({
      apimService,
      serviceLifecycleStore,
      selfcareClient: mocks.SelfcareUtils.getSelfcareClient(),
      apimUserGroups: mocks.apimUserGroups,
    })(item)();

    expect(result).toEqual(E.left(expectedError));

    expect(
      mocks.createSubscriptionForGroupTask,
    ).toHaveBeenCalledExactlyOnceWith(item);
    expect(mocks.syncSubscriptionTask).toHaveBeenCalledExactlyOnceWith(item);
    expect(mocks.syncServicesTask).toHaveBeenCalledExactlyOnceWith(item);
  });

  it("should not execute following tasks after a failure", async () => {
    const item = {
      productId: "prod-io",
      id: "group-id",
      name: "group-name",
      status: "ACTIVE",
    } as GroupChangeEvent;
    const expectedError = new Error("sync subscription error");
    let syncSubscriptionExecuted = false;
    let syncServicesExecuted = false;

    mocks.syncSubscriptionTask.mockReturnValueOnce(async () => {
      syncSubscriptionExecuted = true;
      return E.left(expectedError);
    });
    mocks.syncServicesTask.mockReturnValueOnce(async () => {
      syncServicesExecuted = true;
      return E.right(void 0);
    });

    const result = await handleGroupChangeEvent({
      apimService,
      serviceLifecycleStore,
      selfcareClient: mocks.SelfcareUtils.getSelfcareClient(),
      apimUserGroups: mocks.apimUserGroups,
    })(item)();

    expect(result).toEqual(E.left(expectedError));

    expect(syncSubscriptionExecuted).toBe(true);
    expect(syncServicesExecuted).toBe(false);

    expect(
      mocks.createSubscriptionForGroupTask,
    ).toHaveBeenCalledExactlyOnceWith(item);
    expect(mocks.syncSubscriptionTask).toHaveBeenCalledExactlyOnceWith(item);
    expect(mocks.syncServicesTask).toHaveBeenCalledExactlyOnceWith(item);
  });
});
