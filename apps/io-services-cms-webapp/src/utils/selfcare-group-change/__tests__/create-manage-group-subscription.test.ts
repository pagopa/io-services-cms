import { UserContract } from "@azure/arm-apimanagement";
import { ApimUtils, SelfcareUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AGGREGATOR_MANAGE_GROUP_DISPLAY_NAME_PREFIX,
  createSubscriptionForGroup,
} from "../create-manage-group-subscription";
import { GroupChangeEvent } from "../types";

const getMockInstitution = (institutionId: string) => ({
  description: "An institution",
  externalId: "12345678901",
  id: institutionId,
  onboarding: [
    {
      isAggregator: true,
      productId: "prod-io",
      status: "ACTIVE",
    },
  ],
  taxCode: "12345678901",
});

const mockApimUserGroups = ["group1", "group2"];

const mocks = vi.hoisted(() => ({
  ApimService: {
    createGroupUser: vi.fn(),
    createOrUpdateUser: vi.fn(),
    getUserByEmail: vi.fn(),
    upsertSubscription: vi.fn(),
  },
  SelfcareClient: {
    getInstitutionById: vi
      .fn()
      .mockImplementation((institutionId: string) =>
        TE.right(getMockInstitution(institutionId)),
      ),
  },
}));

describe("createSubscriptionForGroup", () => {
  const deps = {
    apimService: mocks.ApimService as unknown as ApimUtils.ApimService,
    selfcareClient:
      mocks.SelfcareClient as unknown as SelfcareUtils.SelfcareClient,
  };

  const baseEvent = {
    id: "group-id",
    institutionId: "institution-id",
    name: `${AGGREGATOR_MANAGE_GROUP_DISPLAY_NAME_PREFIX}group name`,
    productId: "prod-io",
    status: "ACTIVE",
  } as GroupChangeEvent;

  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.ApimService.createGroupUser.mockReset();
    mocks.ApimService.createOrUpdateUser.mockReset();
    mocks.ApimService.getUserByEmail.mockReset();
    mocks.ApimService.upsertSubscription.mockReset();
    mocks.SelfcareClient.getInstitutionById.mockReset();
    mocks.SelfcareClient.getInstitutionById.mockReset();
  });

  it("should do nothing when the group event is not a create event", async () => {
    //given

    //when
    const result = await createSubscriptionForGroup(
      deps.apimService,
      deps.selfcareClient,
      mockApimUserGroups,
    )(baseEvent)();

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
      ...baseEvent,
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
    const result = await createSubscriptionForGroup(
      deps.apimService,
      deps.selfcareClient,
      mockApimUserGroups,
    )(group)();

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

  it("should return Left when upsertSubscription fails", async () => {
    //given
    const group = {
      ...baseEvent,
      parentInstitutionId: "parent-institution-id",
    } as GroupChangeEvent;
    const user = {
      id: "/users/user-id",
    } as UserContract;
    const reason = "upsert failed";
    const error = new Error(
      `Failed to create manage-group subscription ${ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id}, reason: ${reason}`,
    );

    mocks.ApimService.getUserByEmail.mockReturnValueOnce(
      TE.right(O.some(user)),
    );
    mocks.ApimService.upsertSubscription.mockReturnValueOnce(
      TE.left(new Error(reason)),
    );

    //when
    const result = await createSubscriptionForGroup(
      deps.apimService,
      deps.selfcareClient,
      mockApimUserGroups,
    )(group)();

    //then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toStrictEqual(error);
    }
  });
});
