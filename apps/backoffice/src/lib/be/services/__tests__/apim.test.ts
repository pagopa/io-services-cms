import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSubscriptions } from "../apim";
import { AxiosError, AxiosResponse } from "axios";

const { getApimRestClientMock, getServiceListMock } = vi.hoisted(() => ({
  getApimRestClientMock: vi.fn(),
  getServiceListMock: vi.fn(),
}));

const anUserId = "anUserId";

vi.mock("@/lib/be/apim-service", () => ({
  getApimRestClient: getApimRestClientMock,
}));

afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
});

describe("getSubscriptions", () => {
  it("should return Error when getApimRestClient fail", async () => {
    // given
    const errorMessage = "error message";
    getApimRestClientMock.mockRejectedValueOnce(new Error(errorMessage));

    // when
    const res = await getSubscriptions(anUserId, 1, 0)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).toStrictEqual(errorMessage);
    }
    expect(getApimRestClientMock).toHaveBeenCalledOnce();
    expect(getApimRestClientMock).toHaveBeenCalledWith();
    expect(getServiceListMock).not.toHaveBeenCalled();
  });

  it.each`
    scenario                          | error
    ${"a generic error"}              | ${new Error("message")}
    ${"an non-not found axios error"} | ${new AxiosError("message")}
  `(
    "should return Error when getServiceList return $scenario",
    async ({ error }) => {
      // given
      getApimRestClientMock.mockResolvedValueOnce({
        getServiceList: getServiceListMock,
      });
      getServiceListMock.mockReturnValueOnce(TE.left(error));
      const limit = 1;
      const offset = 0;
      const serviceId = undefined;

      // when
      const res = await getSubscriptions(anUserId, limit, offset, serviceId)();

      // then
      expect(E.isLeft(res)).toBeTruthy();
      if (E.isLeft(res)) {
        expect(res.left).toStrictEqual(error);
      }
      expect(getApimRestClientMock).toHaveBeenCalledOnce();
      expect(getApimRestClientMock).toHaveBeenCalledWith();
      expect(getServiceListMock).toHaveBeenCalledOnce();
      expect(getServiceListMock).toHaveBeenCalledWith(
        anUserId,
        limit,
        offset,
        serviceId,
      );
    },
  );

  it("should return am empty subscriptions list when getServiceList return n not found axios error", async () => {
    // given
    getApimRestClientMock.mockResolvedValueOnce({
      getServiceList: getServiceListMock,
    });
    getServiceListMock.mockReturnValueOnce(
      TE.left(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 404,
        } as AxiosResponse),
      ),
    );
    const limit = 1;
    const offset = 0;
    const serviceId = undefined;

    // when
    const res = await getSubscriptions(anUserId, limit, offset, serviceId)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({
        count: 0,
        value: [],
      });
    }
    expect(getApimRestClientMock).toHaveBeenCalledOnce();
    expect(getApimRestClientMock).toHaveBeenCalledWith();
    expect(getServiceListMock).toHaveBeenCalledOnce();
    expect(getServiceListMock).toHaveBeenCalledWith(
      anUserId,
      limit,
      offset,
      serviceId,
    );
  });

  it("should return the subscriptions list", async () => {
    // given
    getApimRestClientMock.mockResolvedValueOnce({
      getServiceList: getServiceListMock,
    });
    const expectedRes = {
      value: [
        {
          name: "aSubscriptionName",
        },
      ],
      count: 1,
    };
    getServiceListMock.mockReturnValueOnce(TE.right(expectedRes));
    const limit = 1;
    const offset = 0;
    const serviceId = undefined;

    // when
    const res = await getSubscriptions(anUserId, limit, offset, serviceId)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expectedRes);
    }
    expect(getApimRestClientMock).toHaveBeenCalledOnce();
    expect(getApimRestClientMock).toHaveBeenCalledWith();
    expect(getServiceListMock).toHaveBeenCalledOnce();
    expect(getServiceListMock).toHaveBeenCalledWith(
      anUserId,
      limit,
      offset,
      serviceId,
    );
  });
});
