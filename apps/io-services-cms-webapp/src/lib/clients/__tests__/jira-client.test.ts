import { describe, expect, it, vitest } from "vitest";
import * as config from "../../../config";
import { jiraClient, StringFromADF } from "../jira-client";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

const JIRA_CONFIG = {
  JIRA_NAMESPACE_URL: "anUrl",
  JIRA_PROJECT_NAME: "BOARD",
  JIRA_TOKEN: "token",
  JIRA_USERNAME: "aJiraUsername",
  JIRA_ISSUE_HIGH_PRIORITY_ID: "2",
  JIRA_ISSUE_MEDIUM_PRIORITY_ID: "3",
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
const aJiraIssueTransitionId = "4" as NonEmptyString;
const aMessage = "aMessage" as NonEmptyString;
const aCreateJiraIssueResponse = {
  id: aJiraIssueId,
  key: "anIssueKey",
};
const aSearchIssuesPayload = {
  fields: ["status", "comment"],
  fieldsByKeys: false,
  maxResults: 15,
  jql: "project = IEST",
};

const aSearchJiraIssuesResponse = {
  issues: [
    {
      id: "122796" as NonEmptyString,
      key: "IEST-17" as NonEmptyString,
      fields: {
        comment: {
          comments: [
            {
              body: {
                version: 1,
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Questo è un commento",
                      },
                    ],
                  },
                ],
              },
            },
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
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message");
      expect(issue.left.message).toContain(
        "Jira API createJiraIssue returns an error",
      );
    }
  });

  it("should return a misconfiguration error if createJiraIssue returns a status code 401", async () => {
    const mockFetch = getMockFetchWithStatus(401);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
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
        "Jira secrets misconfiguration",
      );
    }
  });

  it("should return an invalid request error if createJiraIssue returns a status code 400", async () => {
    const mockFetch = getMockFetchWithStatus(400);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message");
      expect(issue.left.message).toContain("Invalid request");
    }
  });

  it("should return an unknown status code response error if createJiraIssue returns a not expected status code", async () => {
    const mockFetch = getMockFetchWithStatus(123);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.createJiraIssue(
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message");
      expect(issue.left.message).toContain("Unknown status code 123 received");
    }
  });

  it("should create an Issue with right parameters", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
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
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
      ["TEST-LABEL" as NonEmptyString],
      customFields,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining('"customfield_10364":"12345678901"') &&
        expect.stringContaining(
          `"priority":{"id":"${JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID}"}`,
        ),
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
  it("should return a generic error if searchJiraIssues returns a status code 500 or above", async () => {
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
      expect(issues.left).toHaveProperty("message");
      expect(issues.left.message).toContain(
        "Jira API searchJiraIssues returns an error",
      );
    }
  });

  it("should retrieve Issues", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesResponse),
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
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message");
      expect(issue.left.message).toContain(
        "Jira API updateJiraIssue returns an error",
      );
    }
  });

  it("should return a misconfiguration error if updateJiraIssue returns a status code 401", async () => {
    const mockFetch = getMockFetchWithStatus(401);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
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
        "Jira secrets misconfiguration",
      );
    }
  });

  it("should return an invalid request error if updateJiraIssue returns a status code 400", async () => {
    const mockFetch = getMockFetchWithStatus(400);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "PUT",
    });

    expect(E.isLeft(issue)).toBeTruthy();
    if (E.isLeft(issue)) {
      expect(issue.left).toHaveProperty("message");
      expect(issue.left.message).toContain("Invalid request");
    }
  });

  it("should return an unknown status code response error if updateJiraIssue returns a not expected status code", async () => {
    const mockFetch = getMockFetchWithStatus(123);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.updateJiraIssue(
      aJiraIssueKey,
      aJiraIssueSummary,
      aJiraIssueDescription,
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
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
        `Unknown status code 123 received`,
      );
    }
  });

  it("should update an Issue with right parameters", async () => {
    mockFetchJson.mockImplementationOnce(() => Promise.resolve(void 0));
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
      JIRA_CONFIG.JIRA_ISSUE_MEDIUM_PRIORITY_ID,
      ["TEST-LABEL" as NonEmptyString],
      customFields,
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

describe("[JiraAPIClient] applyJiraIssueTransition", () => {
  it("should applyJiraIssueTransition", async () => {
    const mockFetch = getMockFetchWithStatus(204);
    const client = jiraClient(JIRA_CONFIG, mockFetch);

    const issue = await client.applyJiraIssueTransition(
      aJiraIssueKey,
      aJiraIssueTransitionId,
      aMessage,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });

    expect(E.isRight(issue)).toBeTruthy();
  });
});

describe("[JiraAPIClient] type check for StringFromADF", () => {
  const validADF = {
    version: 1,
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Questo è un commento",
          },
        ],
      },
    ],
  };

  const validADFString = JSON.stringify(validADF);

  it("should decode a valid ADF object to string", () => {
    const result = StringFromADF.decode(validADF);
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(validADFString);
    }
  });

  it("should encode a valid JSON string back to ADF object", () => {
    const result = StringFromADF.encode(validADFString);
    expect(result).toEqual(validADF);
  });

  it("should fail to decode an invalid ADF object", () => {
    const invalidADF = {
      type: "doc",
      invalidField: "value",
    };

    const result = StringFromADF.decode(invalidADF);
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should fail to decode a non-object input", () => {
    const result = StringFromADF.decode("not an object");
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should validate string type correctly", () => {
    expect(StringFromADF.is("valid string")).toBe(true);
    expect(StringFromADF.is(123)).toBe(false);
    expect(StringFromADF.is(null)).toBe(false);
    expect(StringFromADF.is({})).toBe(false);
  });

  it("should throw error when encoding malformed JSON string", () => {
    expect(() => StringFromADF.encode("invalid json")).toThrow(
      "Cannot parse a malformed json string",
    );
  });
});
