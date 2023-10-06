import { describe, expect, it, vi } from "vitest";
import { retrieveManageKeys } from "../../lib/keys-manage";
import { ApimUtils } from "@io-services-cms/external-clients";
import { BackOfficeUser } from "../../../../../types/next-auth";
import * as TE from "fp-ts/lib/TaskEither";

const anUserEmail = "anEmail@email.it";
const anUserId = "anUserId";
const aSubscriptionId = "aSubscriptionId";
const aUserPermissions = ["permission1", "permission2"];
const jwtMock = ({
  permissions: aUserPermissions,
  parameters: {
    userEmail: anUserEmail,
    userId: anUserId,
    subscriptionId: aSubscriptionId
  }
} as unknown) as BackOfficeUser;
describe("Retrieve Manage Keys", () => {
  it("should return 200 when manage key is found", async () => {
    const mockApimService = ({
      listSecrets: vi.fn(() =>
        TE.right({
          primaryKey: "primary",
          secondaryKey: "secondary",
          status: 200
        })
      )
    } as unknown) as ApimUtils.ApimService;

    const result = await retrieveManageKeys(mockApimService)(jwtMock)();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(mockApimService.listSecrets).toHaveBeenCalledWith(aSubscriptionId);
    expect(result.status).toBe(200);
    expect(result.body).not.toBe(null);
    expect(jsonResponse.primaryKey).toBe("primary");
    expect(jsonResponse.secondaryKey).toBe("secondary");
  });

  it("should return apim status response when api response contains an error", async () => {
    const apimResponseWithError = {
      error: {
        code: "NotFound",
        message: "Resource not found"
      },
      statusCode: 404
    };

    const mockApimService = ({
      listSecrets: vi.fn(() => TE.left(apimResponseWithError))
    } as unknown) as ApimUtils.ApimService;

    const result = await retrieveManageKeys(mockApimService)(jwtMock)();

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(mockApimService.listSecrets).toHaveBeenCalledWith(aSubscriptionId);
    expect(result.status).toBe(apimResponseWithError.statusCode);
    expect(result.body).not.toBe(null);
    expect(jsonResponse).toStrictEqual({
      title: "ApimError",
      status: apimResponseWithError.statusCode,
      detail: JSON.stringify(apimResponseWithError)
    });
  });
});
