import { NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_TITLE_BAD_REQUEST,
  HTTP_TITLE_FORBIDDEN,
} from "../../../../../../config/constants";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";
import type { BackOfficeUserEnriched } from "../../../../../../lib/be/wrappers";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const getInstitutionGroupBaseHandler = vi.fn();
  return {
    getInstitutionGroupBaseHandler,
    withJWTAuthHandler: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUserEnriched; params: any },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) =>
          handler(nextRequest, {
            backofficeUser: backofficeUserMock,
            params,
          }),
    ),
  };
});

vi.mock("@/lib/be/wrappers", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    withJWTAuthHandler: mocks.withJWTAuthHandler,
  };
});

vi.mock("@/utils/get-institution-groups-util", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    getInstitutionGroupBaseHandler: mocks.getInstitutionGroupBaseHandler,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getInstitutionGroups", () => {
  it.each`
    getInstitutionGroupBaseHandlerResponseStatusCode | getInstitutionGroupBaseHandlerResponse
    ${403}                                           | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_FORBIDDEN, title: HTTP_TITLE_FORBIDDEN }, { status: HTTP_STATUS_FORBIDDEN })}
    ${400}                                           | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_BAD_REQUEST, title: HTTP_TITLE_BAD_REQUEST }, { status: HTTP_STATUS_BAD_REQUEST })}
  `(
    "should return an error response bad request when getInstitutionGroupBaseHandler returns a response with status code $getInstitutionGroupBaseHandlerResponseStatusCode",
    async ({
      getInstitutionGroupBaseHandlerResponseStatusCode,
      getInstitutionGroupBaseHandlerResponse,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.getInstitutionGroupBaseHandler.mockReturnValueOnce(
        getInstitutionGroupBaseHandlerResponse,
      );

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(
        getInstitutionGroupBaseHandlerResponseStatusCode,
      );
      expect(jsonBody.detail).toEqual("error detail");
      expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledOnce();
      expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledWith(
        nextRequest,
        {
          backofficeUser: backofficeUserMock,
          params: { institutionId: institutionId },
        },
      );
    },
  );

  it("should return an error response internal server error when getInstitutionGroupBaseHandler throws an error", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const error = new Error("error from getInstitutionGroupBaseHandler");
    mocks.getInstitutionGroupBaseHandler.mockRejectedValueOnce(error);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(500);
    expect(jsonBody.detail).toEqual("Something went wrong");
    expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledOnce();
    expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledWith(
      nextRequest,
      {
        backofficeUser: backofficeUserMock,
        params: { institutionId: institutionId },
      },
    );
  });

  it("should return a 200 response", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const groups = [
      {
        id: "groupId",
        name: "groupName",
        state: "ACTIVE",
      },
    ];
    mocks.getInstitutionGroupBaseHandler.mockReturnValueOnce(groups);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(200);
    expect(jsonBody).toEqual({ groupResponse: groups });
    expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledOnce();
    expect(mocks.getInstitutionGroupBaseHandler).toHaveBeenCalledWith(
      nextRequest,
      {
        backofficeUser: backofficeUserMock,
        params: { institutionId: institutionId },
      },
    );
  });
});
