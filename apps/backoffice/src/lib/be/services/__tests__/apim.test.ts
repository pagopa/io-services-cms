import { ApimUtils } from "@io-services-cms/external-clients";
import { AxiosError, AxiosResponse } from "axios";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSubscriptions } from "../apim";

const { getApimRestClientMock, getServiceListMock: getUserSubscriptionsMock } =
  vi.hoisted(() => ({
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
  const getExpectedFilter = (serviceId?: string) =>
    serviceId
      ? ApimUtils.apim_filters.subscriptionsByIdsApimFilter(serviceId)
      : ApimUtils.apim_filters.subscriptionsExceptManageOneApimFilter();

  it("should return an empty response when serviceIdFilter is an empty array", async () => {
    // given
    const serviceIdFilter = [];

    // when
    const res = await getSubscriptions(anUserId, 1, 0, serviceIdFilter)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({
        count: 0,
        value: [],
      });
    }
    expect(getApimRestClientMock).not.toHaveBeenCalled();
    expect(getUserSubscriptionsMock).not.toHaveBeenCalled();
  });

  it("should return Error when getApimRestClient fail", async () => {
    // given
    const error = new Error("error message");
    getApimRestClientMock.mockRejectedValueOnce(error);

    // when
    const res = await getSubscriptions(anUserId, 1, 0)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left).toStrictEqual(error);
    }
    expect(getApimRestClientMock).toHaveBeenCalledOnce();
    expect(getApimRestClientMock).toHaveBeenCalledWith();
    expect(getUserSubscriptionsMock).not.toHaveBeenCalled();
  });

  it.each`
    scenario                          | error
    ${"a generic error"}              | ${new Error("message")}
    ${"an non-not found axios error"} | ${new AxiosError("message")}
  `(
    "should return Error when getUserSubscriptions return $scenario",
    async ({ error }) => {
      // given
      getApimRestClientMock.mockResolvedValueOnce({
        getUserSubscriptions: getUserSubscriptionsMock,
      });
      getUserSubscriptionsMock.mockReturnValueOnce(TE.left(error));
      const limit = 1;
      const offset = 0;
      const serviceIdFilter = undefined;

      // when
      const res = await getSubscriptions(
        anUserId,
        limit,
        offset,
        serviceIdFilter,
      )();

      // then
      expect(E.isLeft(res)).toBeTruthy();
      if (E.isLeft(res)) {
        expect(res.left).toStrictEqual(error);
      }
      expect(getApimRestClientMock).toHaveBeenCalledOnce();
      expect(getApimRestClientMock).toHaveBeenCalledWith();
      expect(getUserSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getUserSubscriptionsMock).toHaveBeenCalledWith(
        anUserId,
        getExpectedFilter(serviceIdFilter),
        limit,
        offset,
      );
    },
  );

  it("should return am empty subscriptions list when getUserSubscriptions return n not found axios error", async () => {
    // given
    getApimRestClientMock.mockResolvedValueOnce({
      getUserSubscriptions: getUserSubscriptionsMock,
    });
    getUserSubscriptionsMock.mockReturnValueOnce(
      TE.left(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 404,
        } as AxiosResponse),
      ),
    );
    const limit = 1;
    const offset = 0;
    const serviceIdFilter = undefined;

    // when
    const res = await getSubscriptions(
      anUserId,
      limit,
      offset,
      serviceIdFilter,
    )();

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
    expect(getUserSubscriptionsMock).toHaveBeenCalledOnce();
    expect(getUserSubscriptionsMock).toHaveBeenCalledWith(
      anUserId,
      getExpectedFilter(serviceIdFilter),
      limit,
      offset,
    );
  });

  it.each`
    scenario                                   | serviceIdFilter
    ${"serviceIdFilter is undefined"}          | ${undefined}
    ${"serviceIdFilter is a string"}           | ${"id"}
    ${"serviceIdFilter is an array of string"} | ${["id1", "id2"]}
  `(
    "should return the subscriptions list when $scenario",
    async ({ serviceIdFilter }) => {
      // given
      getApimRestClientMock.mockResolvedValueOnce({
        getUserSubscriptions: getUserSubscriptionsMock,
      });
      const expectedRes = {
        value: [
          {
            name: "aSubscriptionName",
          },
        ],
        count: 1,
      };
      getUserSubscriptionsMock.mockReturnValueOnce(TE.right(expectedRes));
      const limit = 1;
      const offset = 0;

      // when
      const res = await getSubscriptions(
        anUserId,
        limit,
        offset,
        serviceIdFilter,
      )();

      // then
      expect(E.isRight(res)).toBeTruthy();
      if (E.isRight(res)) {
        expect(res.right).toStrictEqual(expectedRes);
      }
      expect(getApimRestClientMock).toHaveBeenCalledOnce();
      expect(getApimRestClientMock).toHaveBeenCalledWith();
      expect(getUserSubscriptionsMock).toHaveBeenCalledOnce();
      expect(getUserSubscriptionsMock).toHaveBeenCalledWith(
        anUserId,
        getExpectedFilter(serviceIdFilter),
        limit,
        offset,
      );
    },
  );
});
