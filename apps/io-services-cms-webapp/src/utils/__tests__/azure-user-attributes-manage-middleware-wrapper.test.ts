import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vi } from "vitest";
import { BackofficeInternalSubnetCIDR } from "../../config";
import { AzureUserAttributesManageMiddlewareWrapper } from "../azure-user-attributes-manage-middleware-wrapper";

const mocks: {
  authorizedCIDRs: Set<string>;
} = vi.hoisted(() => ({
  authorizedCIDRs: new Set(["127.160.0.1/32", "127.193.0.0/20"]),
}));
const { AzureUserAttributesManageMiddleware } = vi.hoisted(() => ({
  AzureUserAttributesManageMiddleware: vi.fn(
    () => () =>
      Promise.resolve(
        E.of({
          authorizedCIDRs: mocks.authorizedCIDRs,
          email: "" as any,
          kind: "IAzureUserAttributesManage",
        })
      )
  ),
}));

vi.mock(
  "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage",
  async () => {
    const actual = await vi.importActual(
      "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage"
    );
    return {
      ...(actual as any),
      AzureUserAttributesManageMiddleware,
    };
  }
);

const subscriptionCIDRsModelMock = {
  getSubscriptionCIDRs: vi.fn().mockReturnValue(
    Promise.resolve(
      E.right({
        authorizedCIDRs: new Set(),
      })
    )
  ),
} as unknown as SubscriptionCIDRsModel;

const BackofficeInternalSubnetCIDRMock = {
  BACKOFFICE_INTERNAL_SUBNET_CIDR: "127.0.0.0/16",
} as BackofficeInternalSubnetCIDR;

describe("AzureUserAttributesManageMiddlewareWrapper", () => {
  it("should return empty CIDRs list when request comes from Backoffice Subnet", async () => {
    const requestMock = {
      ip: "127.0.0.2",
    } as any;

    const result = await AzureUserAttributesManageMiddlewareWrapper(
      subscriptionCIDRsModelMock,
      BackofficeInternalSubnetCIDRMock
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

  it("should return the actual CIDRs list when request comes outside Backoffice Subnet", async () => {
    const requestMock = {
      ip: "127.200.0.2",
    } as any;

    const result = await AzureUserAttributesManageMiddlewareWrapper(
      subscriptionCIDRsModelMock,
      BackofficeInternalSubnetCIDRMock
    )(requestMock);

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual({
        authorizedCIDRs: mocks.authorizedCIDRs,
        email: "" as any,
        kind: "IAzureUserAttributesManage",
      });
    }
  });
});
