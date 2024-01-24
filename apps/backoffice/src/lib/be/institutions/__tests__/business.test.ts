import { faker } from "@faker-js/faker/locale/it";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistanceItem } from "../../../../generated/api/AssistanceItem";
import { AssistanceResponse } from "../../../../generated/api/AssistanceResponse";
import { sendAssistanceRequest } from "../business";

const { sendSupportRequestMock } = vi.hoisted(() => ({
  sendSupportRequestMock: vi.fn()
}));

vi.mock("../selfcare", async () => ({
  sendSupportRequest: sendSupportRequestMock
}));

const mocks: {
  aAssistanceRequest: AssistanceItem;
  aAssistanceResponse: AssistanceResponse;
} = {
  aAssistanceRequest: { email: faker.internet.email() as EmailString },
  aAssistanceResponse: { redirectUrl: faker.internet.url() }
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendAssistanceRequest", () => {
  it("should forward sendSupport error", async () => {
    const error = new Error("rejected");
    sendSupportRequestMock.mockRejectedValueOnce(error);
    await expect(
      sendAssistanceRequest(mocks.aAssistanceRequest)
    ).rejects.toThrowError(error);
    expect(sendSupportRequestMock).toBeCalledTimes(1);
    expect(sendSupportRequestMock).toBeCalledWith(mocks.aAssistanceRequest);
  });

  it("should forward sendSupport response", async () => {
    const error = new Error("rejected");
    sendSupportRequestMock.mockResolvedValueOnce(mocks.aAssistanceResponse);
    await expect(
      sendAssistanceRequest(mocks.aAssistanceRequest)
    ).resolves.toStrictEqual(mocks.aAssistanceResponse);
    expect(sendSupportRequestMock).toBeCalledTimes(1);
    expect(sendSupportRequestMock).toBeCalledWith(mocks.aAssistanceRequest);
  });
});
