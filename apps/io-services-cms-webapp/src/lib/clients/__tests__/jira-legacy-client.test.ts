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
    const mockHeaders = new Map();
    mockHeaders.set("anHeader", "anHeaderValue");

    const resultObj = {
      errorMessages: "Error on Jira response",
    };

    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() => Promise.resolve(resultObj)),
      headers: {
        forEach: (callback) => mockHeaders.forEach(callback),
        get: (key) => mockHeaders.get(key),
      },
      status: 500,
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
        `Jira API returns an error, responseBody: ${JSON.stringify(resultObj)}`
      );
    }
  });

<<<<<<< Updated upstream
  it("should return the deserializzation error if searchJiraIssueByServiceId body extractions json end up in failure", async () => {
    const mockHeaders = new Map();
    mockHeaders.set("anHeader", "anHeaderValue");

=======
  it("should return the deserializzation error if searchJiraIssueByServiceId body extractions both json and text end up in failure", async () => {
>>>>>>> Stashed changes
    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() =>
        Promise.reject(new Error("Bad Error on JSON deserialize"))
      ),
<<<<<<< Updated upstream
      headers: {
        forEach: (callback) => mockHeaders.forEach(callback),
        get: (key) => mockHeaders.get(key),
      },
      status: 500,
=======
      text: vitest.fn(() =>
        Promise.reject(new Error("Bad Error on Text deserialize"))
      ),
      status: 429,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        'Error parsing Jira response, statusCode: 500, headers: {"anHeader":"anHeaderValue"}, error: Bad Error on JSON deserialize'
=======
        "Error parsing Jira response: Bad Error on JSON deserialize"
      );
    }
  });

  it("should return the text response if searchJiraIssueByServiceId body is not a valid json", async () => {
    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() => Promise.reject(new Error("Bad Error"))),
      text: vitest.fn(() => Promise.resolve("Not Json Response")),
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
        "Received a not JSON response from JIRA, the content is: Not Json Response"
>>>>>>> Stashed changes
      );
    }
  });

  it(
    "should fail after execute retries",
    async () => {
      const mockHeaders = new Map();
      mockHeaders.set("Retry-After", "2");

      const mockFetch = vitest.fn().mockImplementation(async () => ({
        json: vitest.fn(() =>
          Promise.reject(new Error("Bad Error on JSON deserialize"))
        ),
        headers: {
          forEach: (callback) => mockHeaders.forEach(callback),
          get: (key) => mockHeaders.get(key),
        },
        status: 429,
      }));

      const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);
      const maxRetry = 2;

      const issues = await client.searchJiraIssueByServiceId(aServiceId, {
        maxRetry,
      })();

      expect(mockFetch).toBeCalledWith(expect.any(String), {
        body: expect.any(String),
        headers: expect.any(Object),
        method: "POST",
      });

      expect(mockFetch).toBeCalledTimes(maxRetry + 1);

      expect(E.isLeft(issues)).toBeTruthy();
      if (E.isLeft(issues)) {
        expect(issues.left).toHaveProperty(
          "message",
          'Cannot Contact jira after retries, statusCode: 429, headers: {"Retry-After":"2"}'
        );
      }
    },
    { timeout: 15000 }
  );

  it(
    "should retry with the default delay on 429 response with no Retry header",
    async () => {
      const mockHeaders = new Map();
      mockHeaders.set("anotherHeader", "anotherHeaderValue");

      const mockFetch = vitest.fn().mockImplementation(async () => ({
        json: vitest.fn(() =>
          Promise.reject(new Error("Bad Error on JSON deserialize"))
        ),
        headers: {
          forEach: (callback) => mockHeaders.forEach(callback),
          get: (key) => mockHeaders.get(key),
        },
        status: 429,
      }));

      const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

      const maxRetry = 2;
      const defaultRetryAfter = 1000;

      const issues = await client.searchJiraIssueByServiceId(aServiceId, {
        maxRetry,
        defaultRetryAfter,
      })();

      expect(mockFetch).toBeCalledWith(expect.any(String), {
        body: expect.any(String),
        headers: expect.any(Object),
        method: "POST",
      });

      expect(mockFetch).toBeCalledTimes(maxRetry + 1);

      expect(E.isLeft(issues)).toBeTruthy();
      if (E.isLeft(issues)) {
        expect(issues.left).toHaveProperty(
          "message",
          'Cannot Contact jira after retries, statusCode: 429, headers: {"anotherHeader":"anotherHeaderValue"}'
        );
      }
    },
    { timeout: 7000 }
  );

  it(
    "should retry with the default delay on 429 response with Retry header containing not a number",
    async () => {
      const mockHeaders = new Map();
      mockHeaders.set("Retry-After", "anotherHeaderValue");

      const mockFetch = vitest.fn().mockImplementation(async () => ({
        json: vitest.fn(() =>
          Promise.reject(new Error("Bad Error on JSON deserialize"))
        ),
        headers: {
          forEach: (callback) => mockHeaders.forEach(callback),
          get: (key) => mockHeaders.get(key),
        },
        status: 429,
      }));

      const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

      const issues = await client.searchJiraIssueByServiceId(aServiceId)();

      expect(mockFetch).toBeCalledWith(expect.any(String), {
        body: expect.any(String),
        headers: expect.any(Object),
        method: "POST",
      });

      expect(mockFetch).toBeCalledTimes(6);

      expect(E.isLeft(issues)).toBeTruthy();
      if (E.isLeft(issues)) {
        expect(issues.left).toHaveProperty(
          "message",
          'Cannot Contact jira after retries, statusCode: 429, headers: {"Retry-After":"anotherHeaderValue"}'
        );
      }
    },
    { timeout: 30000 }
  );

  it("should correctly retrieve an issue", async () => {
    const mockHeaders = new Map();
    mockHeaders.set("anHeader", "anHeaderValue");

    const mockFetch = vitest.fn().mockImplementation(async () => ({
      json: vitest.fn(() =>
        Promise.resolve(aSearchJiraIssuesByServiceIdResponse)
      ),
      headers: {
        forEach: (callback) => mockHeaders.forEach(callback),
        get: (key) => mockHeaders.get(key),
      },
      status: 200,
    }));

    const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

    const issue = await client.searchJiraIssueByServiceId(aServiceId)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(issue)).toBeTruthy();
  });

  it(
    "should correctly retrieve an issue after 1 retry",
    async () => {
      const mockHeaders1 = new Map();
      mockHeaders1.set("Retry-After", "2");

      const mockHeaders2 = new Map();
      mockHeaders2.set("anHeader", "anHeaderValue");

      const mockFetch = vitest
        .fn()
        .mockImplementationOnce(async () => ({
          json: vitest.fn(() =>
            Promise.reject(new Error("Bad Error on JSON deserialize"))
          ),
          headers: {
            forEach: (callback) => mockHeaders1.forEach(callback),
            get: (key) => mockHeaders1.get(key),
          },
          status: 429,
        }))
        .mockImplementationOnce(async () => ({
          json: vitest.fn(() =>
            Promise.resolve(aSearchJiraIssuesByServiceIdResponse)
          ),
          headers: {
            forEach: (callback) => mockHeaders2.forEach(callback),
            get: (key) => mockHeaders2.get(key),
          },
          status: 200,
        }));

      const client = jiraLegacyClient(JIRA_CONFIG, mockFetch);

      const issue = await client.searchJiraIssueByServiceId(aServiceId)();

      expect(mockFetch).toBeCalledWith(expect.any(String), {
        body: expect.any(String),
        headers: expect.any(Object),
        method: "POST",
      });

      expect(mockFetch).toBeCalledTimes(2);
      expect(E.isRight(issue)).toBeTruthy();
    },
    { timeout: 5000 }
  );
});
