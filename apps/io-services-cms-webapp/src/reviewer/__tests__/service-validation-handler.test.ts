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
import { createServiceValidationHandler } from "../service-validation-handler";

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

const aValidRequestValidationItem = {
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
    authorized_cidrs: [],
  },
  version: "aVersion",
} as unknown as Queue.RequestReviewItem;

describe("Service Validation Handler", () => {
  it("should fail when incoming item is not a valid RequestReviewItem", async () => {
    const { id, ...anInvalidRequestValidationItem } =
      aValidRequestValidationItem;

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: anInvalidRequestValidationItem })();
    expect(E.isLeft(res)).toBeTruthy();
    if (E.isLeft(res)) {
      expect(res.left.message).match(/is not a valid/);
    }

    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
  });

  it("should fail when incoming item has not a valid SecureChannel configuration and reject fails", async () => {
    const anInvalidSecureChannelItem = {
      ...aValidRequestValidationItem,
      data: {
        ...aValidRequestValidationItem.data,
        require_secure_channel: false,
        metadata: {
          ...aValidRequestValidationItem.data.metadata,
          privacy_url: "http://localhost",
        },
      },
    };
    const errorMessage = "reject fail";
    fsmLifecycleClientMock.reject.mockReturnValue(
      TE.left(new Error(errorMessage))
    );

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: anInvalidSecureChannelItem })();
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
  });

  it("should reject review when incoming item has not a valid SecureChannel configuration (invalid ValidSecureChannelFalseConfig)", async () => {
    const anInvalidSecureChannelItem = {
      ...aValidRequestValidationItem,
      data: {
        ...aValidRequestValidationItem.data,
        require_secure_channel: false,
        metadata: {
          ...aValidRequestValidationItem.data.metadata,
          privacy_url: "http://localhost",
        },
      },
    };
    fsmLifecycleClientMock.reject.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: anInvalidSecureChannelItem })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      anInvalidSecureChannelItem.id,
      expect.objectContaining({
        reason: expect.stringMatching(/privacy_url\] is not a valid/),
      })
    );
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
  });

  it("should reject review when incoming item has not a valid SecureChannel configuration (invalid ValidSecureChannelTrueConfig)", async () => {
    const anInvalidSecureChannelItem = {
      ...aValidRequestValidationItem,
      data: {
        ...aValidRequestValidationItem.data,
        require_secure_channel: true,
        metadata: {
          ...aValidRequestValidationItem.data.metadata,
          privacy_url: "invalid privacy url",
        },
      },
    };
    fsmLifecycleClientMock.reject.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: anInvalidSecureChannelItem })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      anInvalidSecureChannelItem.id,
      expect.objectContaining({
        reason: expect.stringMatching(/privacy_url\] is not a valid/),
      })
    );
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
  });

  it("should reject review when incoming item fails strict validation", async () => {
    const anInvalidSecureChannelItem = {
      ...aValidRequestValidationItem,
      data: {
        ...aValidRequestValidationItem.data,
        metadata: {
          ...aValidRequestValidationItem.data.metadata,
          support_url: "invalid url",
        },
      },
    };

    fsmLifecycleClientMock.reject.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: anInvalidSecureChannelItem })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({});
    }

    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.reject).toHaveBeenCalledWith(
      anInvalidSecureChannelItem.id,
      expect.objectContaining({
        reason: expect.stringMatching(/support_url\] is not a valid/),
      })
    );
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmPublicationClientMock.getStore().fetch).not.toHaveBeenCalled();
  });

  it("should fail when fetch service publication fails", async () => {
    const errorMessage = "fetch fail";
    fsmPublicationClientMock
      .getStore()
      .fetch.mockReturnValue(TE.left(new Error(errorMessage)));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: aValidRequestValidationItem })();
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
  });

  it("should return a RequestReviewAction when fetch service publication return a void option", async () => {
    fsmPublicationClientMock.getStore().fetch.mockReturnValue(TE.right(O.none));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({ item: aValidRequestValidationItem })();
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
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
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

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({
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
    expect(fsmLifecycleClientMock.approve).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
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

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({
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
  });

  it("should approve review when there is no 'required manual review' properties changed", async () => {
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
    fsmLifecycleClientMock.approve.mockReturnValue(TE.right(void 0));

    const res = await createServiceValidationHandler(
      configMock,
      fsmLifecycleClientMock as unknown as ServiceLifecycle.FsmClient,
      fsmPublicationClientMock as unknown as ServicePublication.FsmClient
    )({
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
    expect(fsmLifecycleClientMock.reject).not.toHaveBeenCalled();
  });
});
