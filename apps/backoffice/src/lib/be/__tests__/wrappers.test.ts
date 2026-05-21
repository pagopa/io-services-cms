import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import { withJWTAuthHandler } from "../wrappers";

const mocks: {
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
  jwtMock: {
    institution: { role: "admin", id: "institutionId", isAggregate: false, selcSpecialGroups: [] },
    permissions: { selcGroups: [] },
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId",
    },
  } as unknown as BackOfficeUser,
}));

const { auth } = vi.hoisted(() => ({
  auth: vi.fn().mockResolvedValue({ user: mocks.jwtMock }),
}));

const { retrieveInstitutionGroups } = vi.hoisted(() => ({
  retrieveInstitutionGroups: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("../institutions/business", () => ({
  retrieveInstitutionGroups,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("withJWTAuthHandler", () => {
  it("no token or invalid one provided should end up in 401 response", async () => {
    auth.mockResolvedValueOnce(null);

    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: Promise.resolve({}),
    });

    expect(aMockedHandler).not.toHaveBeenCalled();
    expect(result.status).toBe(401);
  });

  it("valid token provided should end up in 200 response", async () => {
    const jwtMock = structuredClone(mocks.jwtMock);

    auth.mockResolvedValueOnce({ user: jwtMock });

    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: Promise.resolve({}),
    });

    expect(aMockedHandler).toHaveBeenCalledWith(nextRequestMock, {
      backofficeUser: {
        ...jwtMock,
        institution: {
          ...jwtMock.institution,
        },
      },
      params: {},
    });
    expect(result.status).toBe(200);
  });

  it("valid token provided should end up in 200 response without selfcare groups detail when user is an admin", async () => {
    //given
    const jwtMock = structuredClone(mocks.jwtMock);
    jwtMock.institution.role = "admin";
    jwtMock.institution.isAggregate = false;

    auth.mockResolvedValueOnce({ user: jwtMock });
    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 })),
    );
    const nextRequestMock = new NextRequest(new URL("http://localhost"));

    //when
    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: Promise.resolve({}),
    });

    //then
    expect(aMockedHandler).toHaveBeenCalledWith(nextRequestMock, {
      backofficeUser: {
        ...jwtMock,
        institution: {
          ...jwtMock.institution,
        },
        permissions: {
          ...jwtMock.permissions,
          selcGroups: [],
        },
      },
      params: {},
    });
    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
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
      auth.mockResolvedValueOnce({ user: mocks.jwtMock });
      const aMockedHandler = vi.fn(() =>
        Promise.resolve(NextResponse.json({}, { status: 200 })),
      );
      const nextRequestMock = new NextRequest(new URL("http://localhost"));

      //when
      const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
        params: Promise.resolve({}),
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
      expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
    },
  );

  it("valid token provided should end up in 200 response with selfcare groups detail when is not an admin and has selcGroups", async () => {
    //given
    const jwtMock = structuredClone(mocks.jwtMock);
    jwtMock.institution.role = "admin";
    jwtMock.institution.isAggregate = true;
    jwtMock.permissions.selcGroups = ["id1"];

    auth.mockResolvedValueOnce({ user: jwtMock });
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
      params: Promise.resolve({}),
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
        permissions: {
          ...jwtMock.permissions,
          selcGroups: [selcGroups[0]],
        },
      },
      params: {},
    });
    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
    expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
      jwtMock.institution.id,
      "*",
    );
  });

  it.each`
    scenario                           | selcGroups
    ${"selfcare groups are undefined"} | ${undefined}
    ${"selfcare groups are empty"}     | ${[]}
  `(
    "valid token provided should end up in 200 response without selfcare groups detail when $scenario",
    async ({ selcGroups }) => {
      //given
      const jwtMock = structuredClone(mocks.jwtMock);
      jwtMock.institution.role = "admin";
      jwtMock.institution.isAggregate = false;
      jwtMock.permissions.selcGroups = selcGroups;

      auth.mockResolvedValueOnce({ user: jwtMock });
      const aMockedHandler = vi.fn(() =>
        Promise.resolve(NextResponse.json({}, { status: 200 })),
      );
      const nextRequestMock = new NextRequest(new URL("http://localhost"));

      //when
      const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
        params: Promise.resolve({}),
      });

      //then
      expect(aMockedHandler).toHaveBeenCalledWith(nextRequestMock, {
        backofficeUser: {
          ...jwtMock,
          institution: {
            ...jwtMock.institution,
            selcSpecialGroups: [],
          },
          permissions: {
            ...jwtMock.permissions,
            selcGroups: [],
          },
        },
        params: {},
      });
      expect(result.status).toBe(200);
      expect(retrieveInstitutionGroups).not.toHaveBeenCalled();
    },
  );

  it("valid token provided should end up in 200 response with selfcare groups detail when is not an admin and has selcGroups", async () => {
    //given
    const jwtMock = structuredClone(mocks.jwtMock);
    jwtMock.institution.role = "operator";
    jwtMock.institution.isAggregate = false;
    jwtMock.permissions.selcGroups = ["id1"];

    auth.mockResolvedValueOnce({ user: jwtMock });
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
      params: Promise.resolve({}),
    });

    //then
    expect(aMockedHandler).toHaveBeenCalledWith(nextRequestMock, {
      backofficeUser: {
        ...jwtMock,
        institution: {
          ...jwtMock.institution,
          selcSpecialGroups: [],
        },
        permissions: {
          ...jwtMock.permissions,
          selcGroups: [selcGroups[0]],
        },
      },
      params: {},
    });
    expect(result.status).toBe(200);
    expect(retrieveInstitutionGroups).toHaveBeenCalledOnce();
    expect(retrieveInstitutionGroups).toHaveBeenCalledWith(
      jwtMock.institution.id,
      "*",
    );
  });
});
