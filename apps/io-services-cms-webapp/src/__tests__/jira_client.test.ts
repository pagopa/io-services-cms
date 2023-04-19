import { describe, expect, it, vitest } from "vitest";
import * as config from "../config";
import { JiraAPIClient, jiraConfig } from "../jira_client";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

const JIRA_CONFIG = {
  JIRA_NAMESPACE_URL: "anUrl",
  JIRA_PROJECT_NAME: "BOARD",
  JIRA_TOKEN: "token",
  JIRA_USERNAME: "aJiraUsername",
} as config.JiraConfig;

const aJiraClientConfig: jiraConfig = {
  projectName: JIRA_CONFIG.JIRA_PROJECT_NAME,
  jiraUsername: JIRA_CONFIG.JIRA_USERNAME,
  token: JIRA_CONFIG.JIRA_TOKEN,
};

const mockFetchJson = vitest.fn();
const getMockFetchWithStatus = (status: number) =>
  vitest.fn().mockImplementation(async () => ({
    json: mockFetchJson,
    status,
  }));

const aJiraIssueSummary = "Titolo della Card" as NonEmptyString;
const aJiraIssueDescription = [] as ReadonlyArray<unknown>;
const aJiraIssueId = "1" as NonEmptyString;
const aCreateJiraIssueResponse = {
  id: aJiraIssueId,
  key: "anIssueKey",
};

describe("[JiraAPIClient] createJiraIssue", () => {
  it("should return a generic error if createJiraIssue returns a status code 500 or above", async () => {
    const mockFetch = getMockFetchWithStatus(500);
    const client = JiraAPIClient(
      JIRA_CONFIG.JIRA_NAMESPACE_URL,
      aJiraClientConfig,
      mockFetch
    );

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message", "Jira API returns an error");
    }
  });

  it("should return a misconfiguration error if createJiraIssue returns a status code 401", async () => {
    const mockFetch = getMockFetchWithStatus(401);
    const client = JiraAPIClient(
      JIRA_CONFIG.JIRA_NAMESPACE_URL,
      aJiraClientConfig,
      mockFetch
    );

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty(
        "message",
        "Jira secrets misconfiguration"
      );
    }
  });

  it("should return an invalid request error if createJiraIssue returns a status code 400", async () => {
    const mockFetch = getMockFetchWithStatus(400);
    const client = JiraAPIClient(
      JIRA_CONFIG.JIRA_NAMESPACE_URL,
      aJiraClientConfig,
      mockFetch
    );

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message", "Invalid request");
    }
  });

  it("should return an unknown status code response error if createJiraIssue returns a not expected status code", async () => {
    const mockFetch = getMockFetchWithStatus(123);
    const client = JiraAPIClient(
      JIRA_CONFIG.JIRA_NAMESPACE_URL,
      aJiraClientConfig,
      mockFetch
    );

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty(
        "message",
        "Unknown status code response error"
      );
    }
  });

  it("should create an Issue with right parameters", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse)
    );
    const mockFetch = getMockFetchWithStatus(201);
    const client = JiraAPIClient(
      JIRA_CONFIG.JIRA_NAMESPACE_URL,
      aJiraClientConfig,
      mockFetch
    );

    let customFields: Map<string, unknown> = new Map<string, unknown>();
    customFields.set("customfield_10364", "12345678901");
    customFields.set("customfield_10365", {
      id: "10549",
      value: "Assente",
    });

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription,
      ["TEST-LABEL" as NonEmptyString],
      customFields
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining('"customfield_10364":"12345678901"'),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isRight(issue)).toBeTruthy();
    if (E.isRight(issue)) {
      expect(issue.right).toHaveProperty("id", aCreateJiraIssueResponse.id);
      expect(issue.right).toHaveProperty("key", aCreateJiraIssueResponse.key);
    }
  });
});
