import { NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_TITLE_BAD_REQUEST,
  HTTP_TITLE_FORBIDDEN,
} from "../../../../../../../config/constants";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";
import type { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const institutionGroupBaseHandler = vi.fn();
  return {
    institutionGroupBaseHandler,
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

vi.mock("../../institution-groups-util", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    institutionGroupBaseHandler: mocks.institutionGroupBaseHandler,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getInstitutionGroups", () => {
  it.each`
    institutionGroupBaseHandlerResponseStatusCode | institutionGroupBaseHandlerResponse
    ${403}                                        | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_FORBIDDEN, title: HTTP_TITLE_FORBIDDEN }, { status: HTTP_STATUS_FORBIDDEN })}
    ${400}                                        | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_BAD_REQUEST, title: HTTP_TITLE_BAD_REQUEST }, { status: HTTP_STATUS_BAD_REQUEST })}
  `(
    "should return an error response bad request when institutionGroupBaseHandler returns a response with status code $institutionGroupBaseHandlerResponseStatusCode",
    async ({
      institutionGroupBaseHandlerResponseStatusCode,
      institutionGroupBaseHandlerResponse,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.institutionGroupBaseHandler.mockReturnValueOnce(
        institutionGroupBaseHandlerResponse,
      );

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(institutionGroupBaseHandlerResponseStatusCode);
      expect(jsonBody.detail).toEqual("error detail");
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledWith(
        nextRequest,
        {
          backofficeUser: backofficeUserMock,
          params: { institutionId: institutionId },
        },
      );
    },
  );

  it("should return an error response internal server error when institutionGroupBaseHandler throws an error", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const error = new Error("error from institutionGroupBaseHandler");
    mocks.institutionGroupBaseHandler.mockRejectedValueOnce(error);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(500);
    expect(jsonBody.detail).toEqual("Something went wrong");
    expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
    expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledWith(
      nextRequest,
      {
        backofficeUser: backofficeUserMock,
        params: { institutionId: institutionId },
      },
    );
  });

  it.each`
    scenario                        | responseCode | groupsResult
    ${"the result groups is empty"} | ${204}       | ${[]}
    ${"there are groups"}           | ${200}       | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}
  `(
    "should return a $responseCode response when $scenario",
    async ({ responseCode, groupsResult }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      const groups =
        mocks.institutionGroupBaseHandler.mockReturnValueOnce(groupsResult);

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(responseCode);
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledWith(
        nextRequest,
        {
          backofficeUser: backofficeUserMock,
          params: { institutionId: institutionId },
        },
      );
    },
  );
});
