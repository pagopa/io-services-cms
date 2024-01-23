import { faker } from "@faker-js/faker/locale/it";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SupportRequestDto } from "../../../../types/selfcare/SupportRequestDto";
import { SupportResponse } from "../../../../types/selfcare/SupportResponse";
import { ManagedInternalError } from "../../errors";
import { sendSupportRequest } from "../selfcare";

const { sendSupportRequestMock } = vi.hoisted(() => ({
  sendSupportRequestMock: vi.fn()
}));

vi.mock("../../selfcare-client", async () => ({
  getSelfcareClient: () => ({
    sendSupportRequest: sendSupportRequestMock
  })
}));

const mocks: {
  aSupportRequest: SupportRequestDto;
  aSupportResponse: SupportResponse;
} = {
  aSupportRequest: { email: faker.internet.email() as EmailString },
  aSupportResponse: { redirectUrl: faker.internet.url() }
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendSupportRequest", () => {
  it("should return a ManagedInternalError if selfcare-client return an error", async () => {
    const error = new Error("rejected");
    sendSupportRequestMock.mockReturnValueOnce(TE.left(error));
    await expect(
      sendSupportRequest(mocks.aSupportRequest)
    ).rejects.toThrowError(
      new ManagedInternalError(
        "Error calling selfcare sendSupportRequest API",
        error
      )
    );
    expect(sendSupportRequestMock).toBeCalledTimes(1);
    expect(sendSupportRequestMock).toBeCalledWith(mocks.aSupportRequest);
  });

  it("should return a support response", async () => {
    sendSupportRequestMock.mockReturnValueOnce(
      TE.right(mocks.aSupportResponse)
    );
    await expect(
      sendSupportRequest(mocks.aSupportRequest)
    ).resolves.toStrictEqual(mocks.aSupportResponse);
    expect(sendSupportRequestMock).toBeCalledTimes(1);
    expect(sendSupportRequestMock).toBeCalledWith(mocks.aSupportRequest);
  });
});
