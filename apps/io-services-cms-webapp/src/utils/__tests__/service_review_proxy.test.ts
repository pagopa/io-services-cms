import { describe, expect, it, vitest } from "vitest";
import * as config from "../../config";
import { ServiceReviewProxy } from "../service_review_proxy";
import { Service } from "../../../../../packages/io-services-cms-models/dist/service-lifecycle/types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import {
  JiraAPIClient,
  SearchJiraIssuesResponse,
  jiraAPIClient,
} from "../../jira_client";

const JIRA_CONFIG = {
  JIRA_NAMESPACE_URL: "anUrl",
  JIRA_PROJECT_NAME: "BOARD",
  JIRA_TOKEN: "token",
  JIRA_USERNAME: "aJiraUsername",
  JIRA_CONTRACT_CUSTOM_FIELD: "customfield_1",
  JIRA_DELEGATE_EMAIL_CUSTOM_FIELD: "customfield_2",
  JIRA_DELEGATE_NAME_CUSTOM_FIELD: "customfield_3",
  JIRA_ORGANIZATION_CF_CUSTOM_FIELD: "customfield_4",
  JIRA_ORGANIZATION_NAME_CUSTOM_FIELD: "customfield_5",
} as config.JiraConfig;

const mockFetchJson = vitest.fn();
const getMockFetchWithStatus = (status: number) =>
  vitest.fn().mockImplementation(async () => ({
    json: mockFetchJson,
    status,
  }));

const aCreateJiraIssueResponse = {
  id: "aJiraIssueId",
  key: "anIssueKey",
};

const aService = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
} as unknown as Service;
const aDelegate = {
  name: "Mario Rossi",
  email: "mario.rossi@email.it",
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
      },
    },
  ],
};

describe("Service Review Proxy", () => {
  it("should create a service review on Jira", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse)
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aJiraClient: jiraAPIClient = JiraAPIClient(JIRA_CONFIG, mockFetch);
    const proxy = ServiceReviewProxy(aJiraClient);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aService,
      aDelegate
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"${aJiraClient.config.JIRA_ORGANIZATION_CF_CUSTOM_FIELD}":"12345678901"`
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should retrieve service reviews on Jira", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesResponse)
    );
    const mockFetch = getMockFetchWithStatus(200);

    const aJiraClient: jiraAPIClient = JiraAPIClient(JIRA_CONFIG, mockFetch);
    const proxy = ServiceReviewProxy(aJiraClient);
    const searchKeys = [
      "anIssueKey-1" as NonEmptyString,
      "anIssueKey-2" as NonEmptyString,
    ];
    const serviceReviews = await proxy.searchJiraIssuesByKey(searchKeys)();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"jql":"project = ${
            aJiraClient.config.JIRA_PROJECT_NAME
          } AND key IN(${searchKeys.join(",")})"`
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviews)).toBeTruthy();
  });
});
