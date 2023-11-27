import { describe, expect, it, vitest } from "vitest";
import * as config from "../../../config";
import { SearchJiraIssuesResponse, jiraClient } from "../jira-client";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

const JIRA_CONFIG = {
  JIRA_NAMESPACE_URL: "anUrl",
  JIRA_PROJECT_NAME: "BOARD",
  JIRA_TOKEN: "token",
  JIRA_USERNAME: "aJiraUsername",
} as config.JiraConfig;

const mockFetchJson = vitest.fn();
const getMockFetchWithStatus = (status: number) =>
  vitest.fn().mockImplementation(async () => ({
    json: mockFetchJson,
    status,
  }));

const aJiraIssueSummary = "Titolo della Card" as NonEmptyString;
const aJiraIssueDescription = "aDescription" as NonEmptyString;
const aJiraIssueKey = "aJiraIssueKey" as NonEmptyString;
const aJiraIssueId = "1" as NonEmptyString;
const aCreateJiraIssueResponse = {
  id: aJiraIssueId,
  key: "anIssueKey",
};
const aSearchIssuesPayload = {
  fields: ["status", "comment"],
  fieldsByKeys: false,
  maxResults: 15,
  startAt: 0,
  jql: "project = IEST",
};
const aSearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  startAt: 0,
  total: 12,
  issues: [
    {
      id: "122796" as NonEmptyString,
      key: "IEST-17" as NonEmptyString,
      fields: {
        comment: {
          comments: [
            { body: "Questo è un commento" },
            { body: "Questo è un altro commento" },
            { body: "Un *commento* formattato … {{codice}} ." },
          ],
        },
        status: {
          name: "NEW",
        },
        statuscategorychangedate:
          "2023-05-12T15:24:09.173+0200" as NonEmptyString,
      },
    },
  ],
};

describe("[JiraAPIClient] createJiraIssue", () => {
  it("should return a generic error if createJiraIssue returns a status code 500 or above", async () => {
    const mockFetch = getMockFetchWithStatus(500);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

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
    const client = jiraClient(JIRA_CONFIG, mockFetch);

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
    const client = jiraClient(JIRA_CONFIG, mockFetch);

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
    const client = jiraClient(JIRA_CONFIG, mockFetch);

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
        `Unknown status code 123 received`
      );
    }
  });

  it("should create an Issue with right parameters", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse)
    );
    const mockFetch = getMockFetchWithStatus(201);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const customFields: Map<string, unknown> = new Map<string, unknown>();
    customFields.set("customfield_10364", "12345678901");
    customFields.set("customfield_10365", {
      value: "Null",
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

describe("[JiraAPIClient] searchJiraIssues", () => {
  it("should return a generic error if createJiraIssue returns a status code 500 or above", async () => {
    const mockFetch = getMockFetchWithStatus(500);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issues = await client.searchJiraIssues(aSearchIssuesPayload)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issues)).toBeTruthy();
    if (E.isLeft(issues)) {
      expect(issues.left).toHaveProperty(
        "message",
        "Jira API returns an error"
      );
    }
  });

  it("should retrieve Issues", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesResponse)
    );
    const mockFetch = getMockFetchWithStatus(200);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issues = await client.searchJiraIssues(aSearchIssuesPayload)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(issues)).toBeTruthy();
  });
});

describe("[JiraAPIClient] updateJiraIssue", () => {
  it("should return a generic error if updateJiraIssue returns a status code 500 or above", async () => {
    const mockFetch = getMockFetchWithStatus(500);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message", "Jira API returns an error");
    }
  });

  it("should return a misconfiguration error if updateJiraIssue returns a status code 401", async () => {
    const mockFetch = getMockFetchWithStatus(401);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty(
        "message",
        "Jira secrets misconfiguration"
      );
    }
  });

  it("should return an invalid request error if updateJiraIssue returns a status code 400", async () => {
    const mockFetch = getMockFetchWithStatus(400);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message", "Invalid request");
    }
  });

  it("should return an unknown status code response error if updateJiraIssue returns a not expected status code", async () => {
    const mockFetch = getMockFetchWithStatus(123);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty(
        "message",
        `Unknown status code 123 received`
      );
    }
  });

  it("should update an Issue with right parameters", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(void 0)
    );
    const mockFetch = getMockFetchWithStatus(204);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const customFields: Map<string, unknown> = new Map<string, unknown>();
    customFields.set("customfield_10364", "12345678901");
    customFields.set("customfield_10365", {
      value: "Null",
    });

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
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
      method: "PUT",
    });

    expect(E.isRight(issue)).toBeTruthy();
  });
});
