import { ServiceId } from "@io-services-cms/models/service-lifecycle/definitions";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vitest } from "vitest";
import * as config from "../../../config";
import {
  SearchJiraLegacyIssuesResponse,
  jiraLegacyClient,
} from "../jira-legacy-client";

const JIRA_CONFIG = {
  JIRA_NAMESPACE_URL: "anUrl",
  JIRA_TOKEN: "aToken",
  JIRA_USERNAME: "aJiraUsername",
  LEGACY_JIRA_PROJECT_NAME: "LEGACYBOARD",
} as config.IConfig;

const mockFetchJson = vitest.fn();
const getMockFetchWithStatus = (status: number) =>
  vitest.fn().mockImplementation(async () => ({
    json: mockFetchJson,
    status,
  }));

const aServiceId = "sid" as ServiceId;
const aSearchJiraIssuesByServiceIdResponse: SearchJiraLegacyIssuesResponse = {
  startAt: 0,
  total: 1,
  issues: [
    {
      id: "123456" as NonEmptyString,
      key: "IES-17" as NonEmptyString,
      fields: {
        comment: {
          comments: [{ body: "aCommentBody" }],
        },
        status: {
          name: "DONE", // equivalent to "APPROVED" for cms jira-client
        },
        statuscategorychangedate:
          "2023-05-12T15:24:09.173+0200" as NonEmptyString,
      },
    },
  ],
};

describe("[JiraLegacyClient] searchJiraIssueByServiceId", () => {
  it("should return an error containing the details if searchJiraIssueByServiceId returns an error on body", async () => {
    const resultObj = {
      errorMessages: "Error on Jira response",
    };
    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() => Promise.resolve(resultObj)),
      status: 429,
    }));

    const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

    const issues = await client.searchJiraIssueByServiceId(aServiceId)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issues)).toBeTruthy();
    if (E.isLeft(issues)) {
      expect(issues.left).toHaveProperty(
        "message",
        `Unknown status code 429 received, responseBody: ${JSON.stringify(
          resultObj
        )}`
      );
    }
  });

  it("should return the deserializzation error if searchJiraIssueByServiceId body extractions end up in failure", async () => {
    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() => Promise.reject(new Error("Bad Error"))),
      status: 429,
    }));

    const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

    const issues = await client.searchJiraIssueByServiceId(aServiceId)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issues)).toBeTruthy();
    if (E.isLeft(issues)) {
      expect(issues.left).toHaveProperty("message", "Bad Error");
    }
  });

  it("should correctly retrieve an issue", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesByServiceIdResponse)
    );
    const mockFetch = getMockFetchWithStatus(200);
    const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

    const issue = await client.searchJiraIssueByServiceId(aServiceId)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(issue)).toBeTruthy();
  });
});
