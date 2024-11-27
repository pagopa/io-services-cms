import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  retrieveAuthorizedServiceIds,
  retrieveGroupUnboundedServices,
  retrieveLifecycleServices,
  retrievePublicationServices,
} from "../cosmos";

const {
  bulkFetchLifecycleMock,
  bulkFetchPublicationMock,
  getServiceIdsByGroupIdsMock,
  getGroupUnboundedServicesByIdsMock,
} = vi.hoisted(() => ({
  bulkFetchLifecycleMock: vi.fn(),
  bulkFetchPublicationMock: vi.fn(),
  getServiceIdsByGroupIdsMock: vi.fn(),
  getGroupUnboundedServicesByIdsMock: vi.fn(),
}));

vi.mock("@/lib/be/cosmos-store", () => ({
  getServiceLifecycleCosmosStore: () => ({
    bulkFetch: bulkFetchLifecycleMock,
    getServiceIdsByGroupIds: getServiceIdsByGroupIdsMock,
    getGroupUnboundedServicesByIds: getGroupUnboundedServicesByIdsMock,
  }),
  getServicePublicationCosmosStore: () => ({
    bulkFetch: bulkFetchPublicationMock,
  }),
}));

const mocks = {
  aBaseServiceLifecycle: {
    id: "aServiceId",
    data: {
      name: "aServiceName",
      description: "aServiceDescription",
      authorized_recipients: [],
      authorized_cidrs: [],
      max_allowed_payment_amount: 123,
      metadata: {
        address: "via tal dei tali 123",
        email: "service@email.it",
        pec: "service@pec.it",
        scope: "LOCAL",
      },
      organization: {
        name: "anOrganizationName",
        fiscal_code: "12345678901",
      },
      require_secure_channel: false,
    },
    fsm: {
      state: "draft",
    },
  },
};

afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
});

describe("retrieveLifecycleServices", () => {
  it("should return an empty response when input is an empty array", async () => {
    // given
    const input = [];

    // when
    const res = await retrieveLifecycleServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(input);
    }
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return Error when bulkFetch fail", async () => {
    // given
    const input = ["id"];
    const error = new Error("error message");
    bulkFetchLifecycleMock.mockReturnValueOnce(TE.left(error));

    // when
    const res = await retrieveLifecycleServices(input)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left).toStrictEqual(error);
    }
    expect(bulkFetchLifecycleMock).toHaveBeenCalledOnce();
    expect(bulkFetchLifecycleMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return filtered services", async () => {
    // given
    const input = ["id", "invalid"];
    bulkFetchLifecycleMock.mockImplementationOnce((ids: string[]) =>
      TE.right(
        ids
          .map((id) => ({
            ...mocks.aBaseServiceLifecycle,
            id,
          }))
          .map(O.fromPredicate((service) => service.id !== "invalid")),
      ),
    );

    // when
    const res = await retrieveLifecycleServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([
        {
          ...mocks.aBaseServiceLifecycle,
          id: "id",
        },
      ]);
    }
    expect(bulkFetchLifecycleMock).toHaveBeenCalledOnce();
    expect(bulkFetchLifecycleMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });
});

describe("retrievePublicationServices", () => {
  it("should return an empty response when input is an empty array", async () => {
    // given
    const input = [];

    // when
    const res = await retrievePublicationServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(input);
    }
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return Error when bulkFetch fail", async () => {
    // given
    const input = ["id"];
    const error = new Error("error message");
    bulkFetchPublicationMock.mockReturnValueOnce(TE.left(error));

    // when
    const res = await retrievePublicationServices(input)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left).toStrictEqual(error);
    }
    expect(bulkFetchPublicationMock).toHaveBeenCalledOnce();
    expect(bulkFetchPublicationMock).toHaveBeenCalledWith(input);
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return filtered services", async () => {
    // given
    const input = ["id", "invalid"];
    bulkFetchPublicationMock.mockImplementationOnce((ids: string[]) =>
      TE.right(
        ids
          .map((id) => ({
            ...mocks.aBaseServiceLifecycle,
            id,
          }))
          .map(O.fromPredicate((service) => service.id !== "invalid")),
      ),
    );

    // when
    const res = await retrievePublicationServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([
        {
          ...mocks.aBaseServiceLifecycle,
          id: "id",
        },
      ]);
    }
    expect(bulkFetchPublicationMock).toHaveBeenCalledOnce();
    expect(bulkFetchPublicationMock).toHaveBeenCalledWith(input);
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });
});

describe("retrieveAuthorizedServiceIds", () => {
  it("should return an empty response when input is an empty array", async () => {
    // given
    const input = [];

    // when
    const res = await retrieveAuthorizedServiceIds(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(input);
    }
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return Error when getServiceIdsByGroupIds fail", async () => {
    // given
    const input = ["id"];
    const error = new Error("error message");
    getServiceIdsByGroupIdsMock.mockReturnValueOnce(TE.left(error));

    // when
    const res = await retrieveAuthorizedServiceIds(input)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left).toStrictEqual(error);
    }
    expect(getServiceIdsByGroupIdsMock).toHaveBeenCalledOnce();
    expect(getServiceIdsByGroupIdsMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });

  it("should return service ids", async () => {
    // given
    const input = ["g_id_1", "g_id_2"];
    const expected = ["s_id_1"];
    getServiceIdsByGroupIdsMock.mockReturnValueOnce(TE.right(expected));

    // when
    const res = await retrieveAuthorizedServiceIds(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
    expect(getServiceIdsByGroupIdsMock).toHaveBeenCalledOnce();
    expect(getServiceIdsByGroupIdsMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
  });
});

describe("retrieveGroupUnboundedServices", () => {
  it("should return an empty response when input is an empty array", async () => {
    // given
    const input = [];

    // when
    const res = await retrieveGroupUnboundedServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(input);
    }
    expect(getGroupUnboundedServicesByIdsMock).not.toHaveBeenCalled();
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
  });

  it("should return Error when getGroupUnboundedServicesByIds fail", async () => {
    // given
    const input = ["id"];
    const error = new Error("error message");
    getGroupUnboundedServicesByIdsMock.mockReturnValueOnce(TE.left(error));

    // when
    const res = await retrieveGroupUnboundedServices(input)();

    // then
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left).toStrictEqual(error);
    }
    expect(getGroupUnboundedServicesByIdsMock).toHaveBeenCalledOnce();
    expect(getGroupUnboundedServicesByIdsMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
  });

  it("should return service ids", async () => {
    // given
    const input = ["g_id_1", "g_id_2"];
    const expected = ["s_id_1"];
    getGroupUnboundedServicesByIdsMock.mockReturnValueOnce(TE.right(expected));

    // when
    const res = await retrieveGroupUnboundedServices(input)();

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
    expect(getGroupUnboundedServicesByIdsMock).toHaveBeenCalledOnce();
    expect(getGroupUnboundedServicesByIdsMock).toHaveBeenCalledWith(input);
    expect(bulkFetchPublicationMock).not.toHaveBeenCalled();
    expect(bulkFetchLifecycleMock).not.toHaveBeenCalled();
    expect(getServiceIdsByGroupIdsMock).not.toHaveBeenCalled();
  });
});
