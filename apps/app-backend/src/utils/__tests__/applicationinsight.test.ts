import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_APP_NAME,
  DEFAULT_SAMPLING_PERCENTAGE,
  applicationInsightConfigurationContent,
  getDefaultAppNameForEnv,
} from "../applicationinsight/helper";
import createAppInsightsWrapper from "../applicationinsight/wrapper";
import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";

describe("Helper Azure Application Insight Tests", () => {
  describe("getDefaultAppNameForEnv", () => {
    it("Should return WEBSITE_SITE_NAME if it's set", () => {
      process.env.WEBSITE_SITE_NAME = "testName";
      const result = getDefaultAppNameForEnv();
      expect(result).toBe("testName");
    });

    it("Should return DEFAULT_APP_NAME if WEBSITE_SITE_NAME is not set", () => {
      delete process.env.WEBSITE_SITE_NAME;
      const result = getDefaultAppNameForEnv();
      expect(result).toBe(DEFAULT_APP_NAME);
    });
  });
  describe("applicationInsightConfigurationContent", () => {
    it("Should return APPLICATIONINSIGHTS_CONFIGURATION_CONTENT if it's set", () => {
      process.env.APPLICATIONINSIGHTS_CONFIGURATION_CONTENT = "testContent";
      const result = applicationInsightConfigurationContent();
      expect(result).toBe("testContent");
    });

    it("Should return default content if APPLICATIONINSIGHTS_CONFIGURATION_CONTENT is not set", () => {
      delete process.env.APPLICATIONINSIGHTS_CONFIGURATION_CONTENT;
      const result = applicationInsightConfigurationContent();
      const expected = JSON.stringify({
        samplingPercentage: DEFAULT_SAMPLING_PERCENTAGE,
      });
      expect(result).toBe(expected);
    });
  });
});

describe("Wrapper Azure Application Insight Tests", () => {
  const mockFunc = vi.fn();
  const mockReq = {
    headers: { get: vi.fn() },
    url: "",
    method: "",
  } as unknown as HttpRequest;
  const mockInvocationContext = {
    functionName: "testFunction",
    invocationId: "testId",
  } as unknown as InvocationContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should call the wrapped function when AI_SDK_CONNECTION_STRING is not set", async () => {
    process.env.AI_SDK_CONNECTION_STRING = "";

    const wrapper = createAppInsightsWrapper(mockFunc);
    await wrapper(mockReq, mockInvocationContext);

    expect(mockFunc).toHaveBeenCalled();
  });

  it("Should not call the wrapped function when AI_SDK_CONNECTION_STRING is set", async () => {
    process.env.AI_SDK_CONNECTION_STRING = "testConnectionString";

    const wrapper = createAppInsightsWrapper(mockFunc);
    await wrapper(mockReq, mockInvocationContext);

    expect(mockFunc).toHaveBeenCalled();
  });

  it("Should throw error when the wrapped function throws an error", async () => {
    process.env.AI_SDK_CONNECTION_STRING = "testConnectionString";
    mockFunc.mockImplementationOnce(() => {
      throw new Error("Test error");
    });

    const wrapper = createAppInsightsWrapper(mockFunc);

    await expect(wrapper(mockReq, mockInvocationContext)).rejects.toThrow(
      "Test error"
    );
  });
});
