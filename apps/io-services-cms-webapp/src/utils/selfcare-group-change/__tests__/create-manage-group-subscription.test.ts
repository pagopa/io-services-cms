import { UserContract } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSubscriptionForGroup } from "../create-manage-group-subscription";
import { GroupChangeEvent } from "../types";

const mocks = vi.hoisted(() => ({
  ApimService: {
    getUserByEmail: vi.fn(),
    upsertSubscription: vi.fn(),
  },
}));

describe("createSubscriptionForGroup", () => {
  const deps = {
    apimService: mocks.ApimService as unknown as ApimUtils.ApimService,
  };

  const baseGroup = {
    id: "group-id",
    institutionId: "institution-id",
    name: "group name",
    productId: "prod-io",
    status: "ACTIVE",
  } as GroupChangeEvent;

  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.ApimService.getUserByEmail.mockReset();
    mocks.ApimService.upsertSubscription.mockReset();
  });

  it("should do nothing when the group event is not a create event", async () => {
    //given

    //when
    const result = await createSubscriptionForGroup(deps.apimService)(
      baseGroup,
    )();

    //then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.ApimService.getUserByEmail).not.toHaveBeenCalled();
    expect(mocks.ApimService.upsertSubscription).not.toHaveBeenCalled();
  });

  it("should create manage-group subscription when the group is created", async () => {
    //given
    const group = {
      ...baseGroup,
      parentInstitutionId: "parent-institution-id",
    } as GroupChangeEvent;
    const user = {
      id: "/users/user-id",
    } as UserContract;

    mocks.ApimService.getUserByEmail.mockReturnValueOnce(
      TE.right(O.some(user)),
    );
    mocks.ApimService.upsertSubscription.mockReturnValueOnce(TE.right({}));

    //when
    const result = await createSubscriptionForGroup(deps.apimService)(group)();

    //then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mocks.ApimService.getUserByEmail).toHaveBeenCalledExactlyOnceWith(
      ApimUtils.formatEmailForOrganization(group.institutionId),
    );
    expect(
      mocks.ApimService.upsertSubscription,
    ).toHaveBeenCalledExactlyOnceWith(
      "user-id",
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
      group.name,
    );
  });

  it("should return Left when no APIM user is found for the institution", async () => {
    //given
    const group = {
      ...baseGroup,
      parentInstitutionId: "parent-institution-id",
    } as GroupChangeEvent;
    const error = new Error(
      `Failed to create manage-group subscription ${group.id}, reason: No user found for institution ${group.institutionId}`,
    );

    mocks.ApimService.getUserByEmail.mockReturnValueOnce(TE.right(O.none));

    //when
    const result = await createSubscriptionForGroup(deps.apimService)(group)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
    expect(mocks.ApimService.upsertSubscription).not.toHaveBeenCalled();
  });

  it("should return Left when upsertSubscription fails", async () => {
    //given
    const group = {
      ...baseGroup,
      parentInstitutionId: "parent-institution-id",
    } as GroupChangeEvent;
    const user = {
      id: "/users/user-id",
    } as UserContract;
    const reason = "upsert failed";
    const error = new Error(
      `Failed to create manage-group subscription ${group.id}, reason: ${reason}`,
    );

    mocks.ApimService.getUserByEmail.mockReturnValueOnce(
      TE.right(O.some(user)),
    );
    mocks.ApimService.upsertSubscription.mockReturnValueOnce(
      TE.left(new Error(reason)),
    );

    //when
    const result = await createSubscriptionForGroup(deps.apimService)(group)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
  });
});
