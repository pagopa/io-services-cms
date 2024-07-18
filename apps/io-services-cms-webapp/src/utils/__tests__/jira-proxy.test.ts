import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vitest } from "vitest";
import * as config from "../../config";
import {
  JiraAPIClient,
  JiraIssue,
  SearchJiraIssuesResponse,
  jiraClient,
} from "../../lib/clients/jira-client";
import { Delegate, JiraIssueStatusFilter, jiraProxy } from "../jira-proxy";

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
  JIRA_ISSUE_HIGH_PRIORITY_ID: "2",
  JIRA_ISSUE_MEDIUM_PRIORITY_ID: "3",
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
} as unknown as ServiceLifecycle.definitions.Service;

const aDelegate = {
  name: "Mario Rossi",
  email: "mario.rossi@email.it",
  permissions: [
    "apiservicewrite",
    "apilimitedmessagewrite",
    "apiinforead",
    "apimessageread",
    "apilimitedprofileread",
  ],
} as Delegate;

const aJiraIssue: JiraIssue = {
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
    statuscategorychangedate: "2023-04-06T15:58:21.264+0200" as NonEmptyString,
  },
};

const aSearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  startAt: 0,
  total: 12,
  issues: [aJiraIssue],
};

const anEmptySearchJiraIssuesResponse: SearchJiraIssuesResponse = {
  ...aSearchJiraIssuesResponse,
  issues: [],
};

describe("Service Review Proxy", () => {
  it("should create a service review on Jira", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse)
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const firstPublication = true;
    const serviceReviewTicket = await proxy.createJiraIssue(
      aService,
      aDelegate,
      firstPublication
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

  it("should create a service review on Jira with High priority in case of national service", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse)
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aNationalService = {
      ...aService,
      data: {
        ...aService.data,
        metadata: {
          ...aService.data.metadata,
          scope: "NATIONAL",
        },
      },
    } as unknown as ServiceLifecycle.definitions.Service;

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const firstPublication = true;
    const serviceReviewTicket = await proxy.createJiraIssue(
      aNationalService,
      aDelegate,
      firstPublication
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"priority":{"id":"${JIRA_CONFIG.JIRA_ISSUE_HIGH_PRIORITY_ID}"}`
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

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const searchKeys = [
      "anIssueKey-1" as NonEmptyString,
      "anIssueKey-2" as NonEmptyString,
    ];
    const searchStatuses: JiraIssueStatusFilter[] = ["APPROVED", "REJECTED"];
    const serviceReviews = await proxy.searchJiraIssuesByKeyAndStatus(
      searchKeys,
      searchStatuses
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"jql":"project = ${
            aJiraClient.config.JIRA_PROJECT_NAME
          } AND key IN(${searchKeys.join(
            ","
          )}) AND status IN (APPROVED,REJECTED)"`
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviews)).toBeTruthy();
  });

  it("should retrieve a service review by its ID", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesResponse)
    );
    const mockFetch = getMockFetchWithStatus(200);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReview = await proxy.getJiraIssueByServiceId(
      "aServiceId" as NonEmptyString
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"jql":"project = ${aJiraClient.config.JIRA_PROJECT_NAME} AND summary ~ 'Review #aServiceId'`
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReview)).toBeTruthy();
    if (E.isRight(serviceReview)) {
      expect(O.isSome(serviceReview.right));
      if (O.isSome(serviceReview.right)) {
        expect(E.isRight(JiraIssue.decode(serviceReview.right.value))).toBe(
          true
        );
      }
    }
  });

  it("should not retrieve a service review for a wrong service ID", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(anEmptySearchJiraIssuesResponse)
    );
    const mockFetch = getMockFetchWithStatus(200);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReview = await proxy.getPendingAndRejectedJiraIssueByServiceId(
      "aWrongServiceId" as NonEmptyString
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.any(String),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReview)).toBeTruthy();
    if (E.isRight(serviceReview)) {
      expect(O.isNone(serviceReview.right));
    }
  });

  it("should return a specific Jira API Error if jira client returns a 500 status code", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve({
        errorMessages: ["A specific JIRA error message"],
        errors: {},
      })
    );
    const mockFetch = getMockFetchWithStatus(500);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReview = await proxy.getJiraIssueByServiceId(
      "aServiceId" as NonEmptyString
    )();

    expect(E.isLeft(serviceReview)).toBeTruthy();
    if (E.isLeft(serviceReview)) {
      expect(serviceReview.left.message).toContain("Jira API returns an error");
    }
  });
});
