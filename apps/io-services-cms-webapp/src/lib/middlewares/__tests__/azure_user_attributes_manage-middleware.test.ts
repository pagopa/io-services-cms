import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { AzureUserAttributesManageMiddleware } from "../azure_user_attributes_manage-middleware";
import { SubscriptionCIDRs } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import {
  CosmosErrors,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { describe, expect, it, vi } from "vitest";

vi.mock("winston");

interface IHeaders {
  readonly [key: string]: string | undefined;
}

function lookup(h: IHeaders): (k: string) => string | undefined {
  return (k: string) => h[k];
}

const anUserEmail = "test@example.com" as EmailString;
const aSubscriptionId = "MySubscriptionId" as NonEmptyString;
const aManageSubscriptionId = "MANAGE-MySubscriptionId" as NonEmptyString;
const aSubscriptionCIDRs: SubscriptionCIDRs = {
  subscriptionId: "MANAGE-123" as NonEmptyString,
  cidrs: new Set(["0.0.0.0/0"] as unknown as CIDR[]),
};

describe("AzureUserAttributesManageMiddleware", () => {
  it("should fail on empty user email", async () => {
    const subscriptionCIDRsModel = vi.fn();

    const headers: IHeaders = {
      "x-user-email": "",
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header).toHaveBeenCalledTimes(1);
    expect(mockRequest.header).toHaveBeenCalledWith("x-user-email");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorInternal");
    }
  });

  it("should fail on invalid user email", async () => {
    const subscriptionCIDRsModel = vi.fn();

    const headers: IHeaders = {
      "x-user-email": "xyz",
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header).toHaveBeenCalledTimes(1);
    expect(mockRequest.header).toHaveBeenCalledWith("x-user-email");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorInternal");
    }
  });

  it("should fail on invalid key", async () => {
    const subscriptionCIDRsModel = vi.fn();

    const headers: IHeaders = {
      "x-subscription-id": undefined,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorInternal");
    }
  });

  it("should fail and return an ErrorForbiddenNotAuthorized if the subscription is not a MANAGE subscription", async () => {
    const subscriptionCIDRsModel = {
      findLastVersionByModelId: vi.fn(),
    };

    const headers: IHeaders = {
      "x-subscription-id": aSubscriptionId,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(subscriptionCIDRsModel.findLastVersionByModelId).not.toBeCalled();

    expect(E.isLeft(result));
    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorForbiddenNotAuthorized");
    }
  });

  it("should fail on a subscription cidrs find error", async () => {
    const subscriptionCIDRsModel = {
      findLastVersionByModelId: vi.fn(() =>
        TE.left(toCosmosErrorResponse("") as CosmosErrors),
      ),
    };

    const headers: IHeaders = {
      "x-subscription-id": aManageSubscriptionId,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(
      subscriptionCIDRsModel.findLastVersionByModelId,
    ).toHaveBeenCalledWith([mockRequest.header("x-subscription-id")]);
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorQuery");
    }
  });

  it("should return the user custom attributes if the MANAGE subscription not exists on CosmosDB", async () => {
    const subscriptionCIDRsModel = {
      findLastVersionByModelId: vi.fn(() => TE.fromEither(E.right(O.none))),
    };

    const headers: IHeaders = {
      "x-subscription-id": aManageSubscriptionId,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(
      subscriptionCIDRsModel.findLastVersionByModelId,
    ).toHaveBeenCalledWith([mockRequest.header("x-subscription-id")]);
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right.kind).toEqual("IAzureUserAttributesManage");
      expect(result.right.authorizedCIDRs).toEqual(
        new Set([] as unknown as CIDR[]),
      );
    }
  });

  it("should return the user custom attributes if the subscription is a MANAGE subscription and cidrs is an empty array", async () => {
    const subscriptionCIDRsModel = {
      findLastVersionByModelId: vi.fn(() =>
        TE.fromEither(
          E.right(
            O.some({
              ...aSubscriptionCIDRs,
              cidrs: new Set([] as unknown as CIDR[]),
            }),
          ),
        ),
      ),
    };

    const headers: IHeaders = {
      "x-subscription-id": aManageSubscriptionId,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(
      subscriptionCIDRsModel.findLastVersionByModelId,
    ).toHaveBeenCalledWith([mockRequest.header("x-subscription-id")]);
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right.kind).toEqual("IAzureUserAttributesManage");
      expect(result.right.authorizedCIDRs).toEqual(
        new Set([] as unknown as CIDR[]),
      );
    }
  });

  it("should return the user custom attributes if the subscription is a MANAGE subscription", async () => {
    const subscriptionCIDRsModel = {
      findLastVersionByModelId: vi.fn(() =>
        TE.fromEither(E.right(O.some(aSubscriptionCIDRs))),
      ),
    };

    const headers: IHeaders = {
      "x-subscription-id": aManageSubscriptionId,
      "x-user-email": anUserEmail,
    };

    const mockRequest = {
      header: vi.fn(lookup(headers)),
    };

    const middleware = AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel as any,
    );

    const result = await middleware(mockRequest as any);
    expect(mockRequest.header.mock.calls[0][0]).toBe("x-user-email");
    expect(mockRequest.header.mock.calls[1][0]).toBe("x-subscription-id");
    expect(
      subscriptionCIDRsModel.findLastVersionByModelId,
    ).toHaveBeenCalledWith([mockRequest.header("x-subscription-id")]);
    expect(E.isRight(result));
    if (E.isRight(result)) {
      const attributes = result.right;
      expect(attributes.email).toBe(anUserEmail);
      expect(attributes.kind).toBe("IAzureUserAttributesManage");
      expect(attributes.authorizedCIDRs).toBe(aSubscriptionCIDRs.cidrs);
    }
  });
});
