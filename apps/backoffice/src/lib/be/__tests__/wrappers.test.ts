import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import { withJWTAuthHandler } from "../wrappers";

const mocks: {
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
  jwtMock: {
    institution: { role: "admin", id: "institutionId" },
    permissions: { selcGroups: [] },
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId",
    },
  } as unknown as BackOfficeUser,
}));

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn().mockReturnValue(() => Promise.resolve(mocks.jwtMock)),
}));

const { retrieveInstitutionGroups } = vi.hoisted(() => ({
  retrieveInstitutionGroups: vi.fn(),
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken,
  };
});

vi.mock("../institutions/business", () => ({
  retrieveInstitutionGroups,
}));

describe("withJWTAuthHandler", () => {
  it("no token or invalid one provided should end up in 401 response", async () => {
    getToken.mockReturnValueOnce(Promise.resolve(null));

    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {},
    });

    expect(aMockedHandler).not.toHaveBeenCalled();
    expect(result.status).toBe(401);
  });

  it("valid token provided should end up in 200 response", async () => {
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {},
    });

    expect(aMockedHandler).toHaveBeenCalledWith(
      nextRequestMock,
      expect.objectContaining({
        backofficeUser: mocks.jwtMock,
      }),
    );
    expect(result.status).toBe(200);
  });

  it("valid token provided should end up in 200 response without selfcare groups detail when user is an admin", async () => {
    //given
    mocks.jwtMock.institution.role = "admin";
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));
    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );
    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    //when
    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {},
    });

    //then
    expect(aMockedHandler).toHaveBeenCalledWith(
      nextRequestMock,
      expect.objectContaining({
        backofficeUser: {
          ...mocks.jwtMock,
          permissions: {
            ...mocks.jwtMock.permissions,
            selcGroups: [],
          },
        },
      }),
    );
    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroups).not.toHaveBeenCalledOnce();
  });

  it.each`
    scenario                           | selcGroups
    ${"selfcare groups are undefined"} | ${undefined}
    ${"selfcare groups are empty"}     | ${[]}
  `(
    "valid token provided should end up in 200 response without selfcare groups detail when $scenario",
    async ({ selcGroups }) => {
      //given
      mocks.jwtMock.permissions.selcGroups = selcGroups;
      getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));
      const aMockedHandler = vi.fn(() =>
        Promise.resolve(NextResponse.json({}, { status: 200 })),
      );
      const nextRequestMock = new NextRequest(new URL("http://localhost"));

      //when
      const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
        params: {},
      });

      //then
      expect(aMockedHandler).toHaveBeenCalledWith(
        nextRequestMock,
        expect.objectContaining({
          backofficeUser: {
            ...mocks.jwtMock,
            permissions: {
              ...mocks.jwtMock.permissions,
              selcGroups: [],
            },
          },
        }),
      );
      expect(result.status).toBe(200);
      expect(retrieveInstitutionGroups).not.toHaveBeenCalledOnce();
    },
  );

  it("valid token provided should end up in 200 response with selfcare groups detail when is not an admin and has selcGroups", async () => {
    //given
    mocks.jwtMock.institution.role = "operator";
    mocks.jwtMock.permissions.selcGroups = ["id1"];
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));
    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );
    const selcGroups = [
      { id: "id1", name: "group1", state: "ACTIVE" },
      { id: "id2", name: "group2", state: "ACTIVE" },
    ];
    retrieveInstitutionGroups.mockResolvedValueOnce(selcGroups);
    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    //when
    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {},
    });

    //then
    expect(aMockedHandler).toHaveBeenCalledWith(
      nextRequestMock,
      expect.objectContaining({
        backofficeUser: {
          ...mocks.jwtMock,
          permissions: {
            ...mocks.jwtMock.permissions,
            selcGroups: [selcGroups[0]],
          },
        },
      }),
    );
    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
    expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
      mocks.jwtMock.institution.id,
    );
  });
});
