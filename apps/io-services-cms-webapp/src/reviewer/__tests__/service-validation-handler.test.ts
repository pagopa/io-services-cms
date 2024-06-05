import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Mock, afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { TelemetryClient } from "../../utils/applicationinsight";
import { createServiceValidationHandler } from "../service-validation-handler";
import { CosmosHelper } from "../../utils/cosmos-helper";

afterEach(() => {
  vi.clearAllMocks();
});

const configMock = {
  MANUAL_REVIEW_PROPERTIES: ["data.name", "data.description"],
} as unknown as IConfig;

const fsmLifecycleClientMock = {
  approve: vi.fn(),
  reject: vi.fn(),
};

const fsmPublicationClientMock = {
  getStore: vi.fn<[void], { fetch: Mock<any, any> }>().mockReturnValue({
    fetch: vi.fn(),
  }),
};

const servicePublicationCosmosHelperMock: CosmosHelper = {
  fetchSingleItem: vi.fn(() => TE.right(O.none)),
  fetchItems: vi.fn(() => TE.right(O.none)),
};

const serviceLifecycleCosmosHelperMock: CosmosHelper = {
  fetchSingleItem: vi.fn(() => TE.right(O.none)),
  fetchItems: vi.fn(() => TE.right(O.none)),
};

const appinsightsMocks = {
  trackEvent: vi.fn(),
};

const aValidRequestValidationItem = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      privacy_url: "https://url.com",
      address: "via tal dei tali 123",
      email: "service@email.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  version: "aVersion",
} as unknown as Queue.RequestReviewItem;

const aNonValidRequestValidationItem = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      email: "service@email.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  version: "aVersion",
} as unknown as Queue.RequestReviewItem;

const aNoContactRequestValidationItem = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      privacy_url: "https://url.com",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  version: "aVersion",
} as unknown as Queue.RequestReviewItem;

describe("Service Validation Handler", () => {
  const dependenciesMock: Parameters<typeof createServiceValidationHandler>[0] =
    {
      config: configMock,
      fsmLifecycleClient:
        fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClient:
        fsmPublicationClientMock as unknown as ServicePublication.FsmClient,
      telemetryClient: appinsightsMocks as unknown as TelemetryClient,
      servicePublicationCosmosHelper: servicePublicationCosmosHelperMock,
      serviceLifecycleCosmosHelper: serviceLifecycleCosmosHelperMock,
    };
  it("should fail when incoming item is not a valid RequestReviewItem", async () => {
    const { id, ...anInvalidRequestValidationItem } =
      aValidRequestValidationItem;

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: anInvalidRequestValidationItem,
    })();
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).match(/is not a valid/);
    }

    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
    expect(appinsightsMocks.trackEvent).not.toHaveBeenCalled();
  });

  it("should fail when incoming item has not a valid SecureChannel configuration and reject fails", async () => {
    const anInvalidSecureChannelItem = {
      ...aValidRequestValidationItem,
      data: {
        ...aValidRequestValidationItem.data,
        require_secure_channel: false,
        metadata: {
          ...aValidRequestValidationItem.data.metadata,
          tos_url: "http://localhost",
        },
      },
    };
    const errorMessage = "reject fail";
    fsmLifecycleClientMock.reject.mockReturnValue(
      TE.left(new Error(errorMessage))
    );

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: anInvalidSecureChannelItem,
    })();
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).toStrictEqual(errorMessage);
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      anInvalidSecureChannelItem.id,
      expect.objectContaining({
        reason: expect.stringMatching(/is not a valid/),
      })
    );
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
    expect(appinsightsMocks.trackEvent).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario:
        "incoming item has not a valid SecureChannel configuration (invalid ValidSecureChannelFalseConfig)",
      item: {
        ...aValidRequestValidationItem,
        data: {
          ...aValidRequestValidationItem.data,
          require_secure_channel: false,
          metadata: {
            ...aValidRequestValidationItem.data.metadata,
            tos_url: "http://localhost",
          },
        },
      },
      expected: /tos_url(?=.*is not a valid)/,
    },
    {
      scenario:
        "incoming item has not a valid SecureChannel configuration (invalid ValidSecureChannelTrueConfig)",
      item: {
        ...aValidRequestValidationItem,
        data: {
          ...aValidRequestValidationItem.data,
          require_secure_channel: true,
          metadata: {
            ...aValidRequestValidationItem.data.metadata,
            tos_url: "invalid url",
          },
        },
      },
      expected: /tos_url\] is not a valid/,
    },
    {
      scenario: "incoming item fails strict validation",
      item: {
        ...aValidRequestValidationItem,
        data: {
          ...aValidRequestValidationItem.data,
          metadata: {
            ...aValidRequestValidationItem.data.metadata,
            support_url: "invalid url",
          },
        },
      },
      expected: /support_url\] is not a valid/,
    },
    {
      scenario: "incoming item fails if privacy_url is undefined",
      item: aNonValidRequestValidationItem,
      expected: /privacy_url\] is not a valid/,
    },
    {
      scenario: "incoming item fails if all contact field are undefined",
      item: aNoContactRequestValidationItem,
      expected: /email\] is not a valid/,
    },
  ])("should reject review when $scenario", async ({ item, expected }) => {
    fsmLifecycleClientMock.reject.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(dependenciesMock)({
      item,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({
        reason: expect.stringMatching(expected),
      })
    );
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledOnce();
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledWith({
      name: "services-cms.review.auto-reject",
      properties: { serviceId: item.id },
    });
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
  });

  it("should reject review when service is duplicate", async () => {
    fsmLifecycleClientMock.reject.mockReturnValue(TE.right(void 0));

    const anAlreadyPresentServiceId =
      "anAlreadyPresentServiceId" as NonEmptyString;

    const servicePublicationCosmosHelperPresentMock = {
      fetchItems: vi.fn(() => TE.right(O.some([anAlreadyPresentServiceId]))),
    } as unknown as CosmosHelper;

    const serviceLifecycleCosmosHelperPresentMock = {
      fetchSingleItem: vi.fn(() => TE.right(O.some(anAlreadyPresentServiceId))),
    } as unknown as CosmosHelper;

    const res = await createServiceValidationHandler({
      ...dependenciesMock,
      servicePublicationCosmosHelper: servicePublicationCosmosHelperPresentMock,
      serviceLifecycleCosmosHelper: serviceLifecycleCosmosHelperPresentMock,
    })({
      item: aValidRequestValidationItem,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      aValidRequestValidationItem.id,
      expect.objectContaining({
        reason: expect.stringMatching(
          `Il servizio '${aValidRequestValidationItem.data.name}' ha lo stesso nome di un altro del servizio con ID '${anAlreadyPresentServiceId}'. Per questo motivo non è possibile procedere con l’approvazione del servizio, che risulta essere il duplicato di un altro.`
        ),
      })
    );
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledOnce();
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledWith({
      name: "services-cms.review.auto-reject",
      properties: { serviceId: aValidRequestValidationItem.id },
    });
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
    expect(
      servicePublicationCosmosHelperPresentMock.fetchItems
    ).toHaveBeenCalledOnce();
    expect(
      serviceLifecycleCosmosHelperPresentMock.fetchSingleItem
    ).toHaveBeenCalledOnce();
  });

  it("should fail when fetch service publication fails", async () => {
    const errorMessage = "fetch fail";
    fsmPublicationClientMock
      .getStore()
      .fetch.mockReturnValue(TE.left(new Error(errorMessage)));

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: aValidRequestValidationItem,
    })();
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).toStrictEqual(errorMessage);
    }

    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledOnce();
    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledWith(
      aValidRequestValidationItem.id
    );
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(appinsightsMocks.trackEvent).not.toHaveBeenCalled();
  });

  it("should return a RequestReviewAction when fetch service publication return a void option", async () => {
    fsmPublicationClientMock.getStore().fetch.mockReturnValue(TE.right(O.none));

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: aValidRequestValidationItem,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({
        requestReview: aValidRequestValidationItem,
      });
    }

    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledOnce();
    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledWith(
      aValidRequestValidationItem.id
    );
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledOnce();
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledWith({
      name: "services-cms.review.manual",
      properties: { serviceId: aValidRequestValidationItem.id },
    });
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(
      servicePublicationCosmosHelperMock.fetchItems
    ).toHaveBeenCalledOnce();
    expect(
      serviceLifecycleCosmosHelperMock.fetchSingleItem
    ).not.toHaveBeenCalled();
  });

  it("should return a RequestReviewAction when there is at least one 'required manual review' properties changed", async () => {
    fsmPublicationClientMock.getStore().fetch.mockReturnValue(
      TE.right(
        O.some({
          ...aValidRequestValidationItem,
          data: { ...aValidRequestValidationItem.data, name: "different name" },
        })
      )
    );

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: aValidRequestValidationItem,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({
        requestReview: aValidRequestValidationItem,
      });
    }

    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledOnce();
    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledWith(
      aValidRequestValidationItem.id
    );
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledOnce();
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledWith({
      name: "services-cms.review.manual",
      properties: { serviceId: aValidRequestValidationItem.id },
    });
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(
      servicePublicationCosmosHelperMock.fetchItems
    ).toHaveBeenCalledOnce();
    expect(
      serviceLifecycleCosmosHelperMock.fetchSingleItem
    ).not.toHaveBeenCalled();
  });

  it("should fail when there is no 'required manual review' properties changed, but approve fails", async () => {
    fsmPublicationClientMock.getStore().fetch.mockReturnValue(
      TE.right(
        O.some({
          ...aValidRequestValidationItem,
          data: {
            ...aValidRequestValidationItem.data,
            authorized_cidrs: ["0.0.0.0/0"],
          },
        })
      )
    );
    const errorMessage = "approve fail";
    fsmLifecycleClientMock.approve.mockReturnValue(
      TE.left(new Error(errorMessage))
    );

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: aValidRequestValidationItem,
    })();
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).toStrictEqual(errorMessage);
    }

    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledOnce();
    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledWith(
      aValidRequestValidationItem.id
    );
    expect(fsmLifecycleClientMock.approve).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.approve).toHaveBeenCalledWith(
      aValidRequestValidationItem.id,
      expect.objectContaining({ approvalDate: expect.any(String) })
    );
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(appinsightsMocks.trackEvent).not.toHaveBeenCalled();
  });

  it("should approve review when there is no 'required manual review' properties changed", async () => {
    fsmPublicationClientMock.getStore().fetch.mockReturnValue(
      TE.right(
        O.some({
          ...aValidRequestValidationItem,
          data: {
            ...aValidRequestValidationItem.data,
            require_secure_channel: true,
            authorized_cidrs: ["0.0.0.0/0"],
            metadata: {
              ...aValidRequestValidationItem.data.metadata,
              tos_url: "https://localhost",
            },
          },
        })
      )
    );
    fsmLifecycleClientMock.approve.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(dependenciesMock)({
      item: aValidRequestValidationItem,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledOnce();
    expect(fsmPublicationClientMock.getStore().fetch).toHaveBeenCalledWith(
      aValidRequestValidationItem.id
    );
    expect(fsmLifecycleClientMock.approve).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.approve).toHaveBeenCalledWith(
      aValidRequestValidationItem.id,
      expect.objectContaining({ approvalDate: expect.any(String) })
    );
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledOnce();
    expect(appinsightsMocks.trackEvent).toHaveBeenCalledWith({
      name: "services-cms.review.auto-approve",
      properties: { serviceId: aValidRequestValidationItem.id },
    });
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
  });
});
