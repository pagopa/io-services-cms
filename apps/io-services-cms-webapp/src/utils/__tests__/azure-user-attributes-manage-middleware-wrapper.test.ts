import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vi } from "vitest";
import { BackofficeInternalSubnetCIDRs } from "../../config";
import { AzureUserAttributesManageMiddlewareWrapper } from "../azure-user-attributes-manage-middleware-wrapper";

const mocks: {
  authorizedCIDRs: Set<string>;
} = vi.hoisted(() => ({
  authorizedCIDRs: new Set(),
}));
const { AzureUserAttributesManageMiddleware } = vi.hoisted(() => ({
  AzureUserAttributesManageMiddleware: vi.fn(
    () => () =>
      Promise.resolve(
        E.of({
          authorizedCIDRs: mocks.authorizedCIDRs,
          email: "" as any,
          kind: "IAzureUserAttributesManage",
        }),
      ),
  ),
}));

vi.mock(
  "../../lib/middlewares/azure_user_attributes_manage-middleware",
  async () => {
    const actual = await vi.importActual(
      "../../lib/middlewares/azure_user_attributes_manage-middleware",
    );
    return {
      ...(actual as any),
      AzureUserAttributesManageMiddleware,
    };
  },
);

const subscriptionCIDRsModelMock = {
  getSubscriptionCIDRs: vi.fn().mockReturnValue(
    Promise.resolve(
      E.right({
        authorizedCIDRs: new Set(),
      }),
    ),
  ),
} as unknown as SubscriptionCIDRsModel;

const BackofficeInternalSubnetCIDRMock = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.0/16"],
} as unknown as BackofficeInternalSubnetCIDRs;

describe("AzureUserAttributesManageMiddlewareWrapper", () => {
  it("should return an empty CIDRs list when no authorized CIDRs was set by the user", async () => {
    const requestMock = {} as any;

    const result = await AzureUserAttributesManageMiddlewareWrapper(
      subscriptionCIDRsModelMock,
      BackofficeInternalSubnetCIDRMock,
    )(requestMock);

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual({
        authorizedCIDRs: new Set(),
        email: "" as any,
        kind: "IAzureUserAttributesManage",
      });
    }
  });

  it("should contains the default CIDR in list when authorized CIDRs was set by the user", async () => {
    const requestMock = {} as any;

    const returningCIDRs = ["127.160.0.1/32", "127.193.0.0/20"];

    AzureUserAttributesManageMiddleware.mockReturnValueOnce(() =>
      Promise.resolve(
        E.of({
          authorizedCIDRs: new Set(returningCIDRs),
          email: "" as any,
          kind: "IAzureUserAttributesManage",
        }),
      ),
    );

    const result = await AzureUserAttributesManageMiddlewareWrapper(
      subscriptionCIDRsModelMock,
      BackofficeInternalSubnetCIDRMock,
    )(requestMock);

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      console.log(result.right);
      expect(result.right).toEqual({
        authorizedCIDRs: new Set([
          ...returningCIDRs,
          ...BackofficeInternalSubnetCIDRMock.BACKOFFICE_INTERNAL_SUBNET_CIDRS,
        ]),
        email: "" as any,
        kind: "IAzureUserAttributesManage",
      });
    }
  });
});
