import { afterEach, describe, expect, it, vi } from "vitest";

import { faker } from "@faker-js/faker/locale/it";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SubscriptionKeys } from "../../../../../generated/api/SubscriptionKeys";
import { BackOfficeUserEnriched } from "../../../../../lib/be/wrappers";
import { SelfcareRoles } from "../../../../../types/auth";
import { GET } from "../route";

const userMock: BackOfficeUserEnriched = {
  id: faker.string.uuid(),
  institution: {
    fiscalCode: faker.string.numeric(),
    id: "institutionId",
    logo_url: faker.image.url(),
    name: faker.company.name(),
    role: SelfcareRoles.admin,
    isAggregator: faker.datatype.boolean(),
    isAggregate: faker.datatype.boolean(),
    selcSpecialGroups: [],
  },
  parameters: {
    subscriptionId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    userId: faker.string.uuid(),
  },
  permissions: {
    apimGroups: faker.helpers.multiple(faker.string.alpha),
    selcGroups: [],
  },
};

const mocks = vi.hoisted(() => {
  const getUser = vi.fn(() => userMock);
  return {
    apiKeys: {
      primary_key: "aPrimaryKey",
      secondary_key: "aSecondaryKey",
    } as SubscriptionKeys,
    getManageSubscriptionKeysHandlerMock: vi.fn(),
    withJWTAuthHandler: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUser; params: any },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) =>
          handler(nextRequest, {
            backofficeUser: getUser(),
            params,
          }),
    ),
  };
});

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mocks.withJWTAuthHandler,
}));

vi.mock("../../../subscriptions/[subscriptionId]/keys/handler", () => ({
  getManageSubscriptionKeysHandler: mocks.getManageSubscriptionKeysHandlerMock,
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("Retrieve Manage Keys API", () => {
  it("should forward request", async () => {
    // given
    mocks.getManageSubscriptionKeysHandlerMock.mockResolvedValueOnce(
      NextResponse.json(mocks.apiKeys, { status: 200 }),
    );
    const request = new NextRequest(new URL("http://localhost"));

    // when
    const result = await GET(request, {});

    // then
    expect(result.status).toBe(200);
    const jsonResponse = await new Response(result.body).json();
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
    expect(mocks.getManageSubscriptionKeysHandlerMock).toHaveBeenCalledOnce();
    expect(mocks.getManageSubscriptionKeysHandlerMock).toHaveBeenCalledWith(
      request,
      {
        backofficeUser: expect.anything(), // FIXME: we can be more specific here
        params: { subscriptionId: userMock.parameters.subscriptionId },
      },
    );
  });
});
