import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vitest } from "vitest";
import * as config from "../../config";
import { JiraAPIClient, jiraClient } from "../../lib/clients/jira-client";
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
  FF_SUITABLE_FOR_MINORS_ENABLED: true,
} as config.JiraConfig & Pick<config.IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED">;

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

const aJiraIssue = {
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
    statuscategorychangedate: "2023-04-06T15:58:21.264+0200" as NonEmptyString,
  },
};

const aSearchJiraIssuesResponse = {
  issues: [aJiraIssue],
};

const anEmptySearchJiraIssuesResponse = {
  ...aSearchJiraIssuesResponse,
  issues: [],
};

describe("Service Review Proxy", () => {
  it("should create a service review on Jira", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const firstPublication = true;
    const serviceReviewTicket = await proxy.createJiraIssue(
      aService,
      aDelegate,
      firstPublication,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"${aJiraClient.config.JIRA_ORGANIZATION_CF_CUSTOM_FIELD}":"12345678901"`,
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should include the age values in the ticket description when age is present", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aServiceWithAge = {
      ...aService,
      data: {
        ...aService.data,
        age: { min: 14, max: 65 },
      },
    } as unknown as ServiceLifecycle.definitions.Service;

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aServiceWithAge,
      aDelegate,
      true,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.stringContaining("*Età minima fruizione servizio:* 14") &&
        expect.stringContaining("*Età massima fruizione servizio:* 65"),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should include only the min age value and mark max as missing when only min is present", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aServiceWithOnlyMinAge = {
      ...aService,
      data: {
        ...aService.data,
        age: { min: 14 },
      },
    } as unknown as ServiceLifecycle.definitions.Service;

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aServiceWithOnlyMinAge,
      aDelegate,
      true,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.stringContaining("*Età minima fruizione servizio:* 14") &&
        expect.stringContaining(
          "*Età massima fruizione servizio:* *[ DATO MANCANTE ]*",
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should include only the max age value and mark min as missing when only max is present", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aServiceWithOnlyMaxAge = {
      ...aService,
      data: {
        ...aService.data,
        age: { max: 65 },
      },
    } as unknown as ServiceLifecycle.definitions.Service;

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aServiceWithOnlyMaxAge,
      aDelegate,
      true,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.stringContaining(
          "*Età minima fruizione servizio:* *[ DATO MANCANTE ]*",
        ) && expect.stringContaining("*Età massima fruizione servizio:* 65"),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should mark the age values as missing in the ticket description when age is absent", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aService,
      aDelegate,
      true,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.stringContaining(
          "*Età minima fruizione servizio:* *[ DATO MANCANTE ]*",
        ) &&
        expect.stringContaining(
          "*Età massima fruizione servizio:* *[ DATO MANCANTE ]*",
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should omit the age info from the ticket when the feature flag is disabled", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
    );
    const mockFetch = getMockFetchWithStatus(201);

    const aFfDisabledConfig = {
      ...JIRA_CONFIG,
      FF_SUITABLE_FOR_MINORS_ENABLED: false,
    } as config.JiraConfig &
      Pick<config.IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED">;

    const aServiceWithAge = {
      ...aService,
      data: {
        ...aService.data,
        age: { min: 14, max: 65 },
      },
    } as unknown as ServiceLifecycle.definitions.Service;

    const aJiraClient: JiraAPIClient = jiraClient(aFfDisabledConfig, mockFetch);
    const proxy = jiraProxy(aJiraClient, aFfDisabledConfig);
    const serviceReviewTicket = await proxy.createJiraIssue(
      aServiceWithAge,
      aDelegate,
      true,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body: expect.not.stringContaining("fruizione servizio"),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should create a service review on Jira with High priority in case of national service", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aCreateJiraIssueResponse),
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
      firstPublication,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"priority":{"id":"${JIRA_CONFIG.JIRA_ISSUE_HIGH_PRIORITY_ID}"}`,
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviewTicket)).toBeTruthy();
  });

  it("should retrieve service reviews on Jira", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(aSearchJiraIssuesResponse),
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
      searchStatuses,
    )();

    expect(mockFetch).toBeCalledWith(expect.any(String), {
      body:
        expect.any(String) &&
        expect.stringContaining(
          `"jql":"project = ${
            aJiraClient.config.JIRA_PROJECT_NAME
          } AND key IN(${searchKeys.join(
            ",",
          )}) AND status IN (APPROVED,REJECTED)"`,
        ),
      headers: expect.any(Object),
      method: "POST",
    });
    expect(E.isRight(serviceReviews)).toBeTruthy();
  });

  it("should not retrieve a service review for a wrong service ID", async () => {
    mockFetchJson.mockImplementationOnce(() =>
      Promise.resolve(anEmptySearchJiraIssuesResponse),
    );
    const mockFetch = getMockFetchWithStatus(200);

    const aJiraClient: JiraAPIClient = jiraClient(JIRA_CONFIG, mockFetch);
    const proxy = jiraProxy(aJiraClient, JIRA_CONFIG);
    const serviceReview = await proxy.getPendingAndRejectedJiraIssueByServiceId(
      "aWrongServiceId" as NonEmptyString,
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
});
