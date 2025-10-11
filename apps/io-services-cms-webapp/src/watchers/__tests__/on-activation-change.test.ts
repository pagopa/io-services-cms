import { beforeEach, describe, expect, it, vi } from "vitest";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { makeHandler } from "../on-activations-change";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

const mock = vi.hoisted(() => ({
  legacyActivationModel: { upsert: vi.fn() },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("makeHandler", () => {
  const deps = {
    legacyActivationModel: mock.legacyActivationModel,
  } as unknown as Parameters<typeof makeHandler>[0];

  const validActivation = {
    fiscalCode: "RSSMRA80A01H501U",
    serviceId: "serviceId",
    status: "ACTIVE" as const,
    modifiedAt: 1617187200000,
  };

  it("should fail when the buffer is not valid JSON", async () => {
    // given
    const invalidBuffer = Buffer.from("invalid json");

    // when
    const result = await makeHandler(deps)({ inputs: [invalidBuffer] })();

    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left.message).toContain("Unexpected token");
    }
    expect(mock.legacyActivationModel.upsert).not.toHaveBeenCalled();
  });

  it("should fail when the buffer is not a valid Activation", async () => {
    // given
    const invalidActivation = { ...validActivation, status: "WRONG_STATUS" };
    const invalidBuffer = Buffer.from(JSON.stringify(invalidActivation));

    // when
    const result = await makeHandler(deps)({ inputs: [invalidBuffer] })();
    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left.message).toContain(
        "at [root.status.0] is not a valid",
      );
    }
    expect(mock.legacyActivationModel.upsert).not.toHaveBeenCalled();
  });

  it("should fail when upsert fails", async () => {
    // given
    const validBuffer = Buffer.from(JSON.stringify(validActivation));
    const error = new Error("upsert error");
    mock.legacyActivationModel.upsert.mockReturnValueOnce(TE.left(error));

    // when
    const result = await makeHandler(deps)({ inputs: [validBuffer] })();
    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left).toStrictEqual(error);
    }
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledOnce();
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledWith({
      fiscalCode: validActivation.fiscalCode,
      kind: "INewActivation",
      serviceId: validActivation.serviceId,
      status: "ACTIVE",
    });
  });

  it("should fail when upsert fails for a cosmos empty response", async () => {
    // given
    const validBuffer = Buffer.from(JSON.stringify(validActivation));
    const error: CosmosErrors = { kind: "COSMOS_CONFLICT_RESPONSE" };
    mock.legacyActivationModel.upsert.mockReturnValueOnce(TE.left(error));

    // when
    const result = await makeHandler(deps)({ inputs: [validBuffer] })();
    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left.message).toStrictEqual(error.kind);
    }
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledOnce();
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledWith({
      fiscalCode: validActivation.fiscalCode,
      kind: "INewActivation",
      serviceId: validActivation.serviceId,
      status: "ACTIVE",
    });
  });

  it("should fail when upsert fails for a cosmos decoding error", async () => {
    // given
    const validBuffer = Buffer.from(JSON.stringify(validActivation));
    const error: CosmosErrors = {
      kind: "COSMOS_DECODING_ERROR",
      error: [{ context: [], value: "a", message: "b" }],
    };
    mock.legacyActivationModel.upsert.mockReturnValueOnce(TE.left(error));

    // when
    const result = await makeHandler(deps)({ inputs: [validBuffer] })();
    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left.message).toStrictEqual(JSON.stringify(error.error));
    }
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledOnce();
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledWith({
      fiscalCode: validActivation.fiscalCode,
      kind: "INewActivation",
      serviceId: validActivation.serviceId,
      status: "ACTIVE",
    });
  });

  it("should fail when upsert fails for a cosmos error", async () => {
    // given
    const validBuffer = Buffer.from(JSON.stringify(validActivation));
    const error: CosmosErrors = {
      kind: "COSMOS_ERROR_RESPONSE",
      error: {
        code: 500,
        message: "internal server error",
        name: "Error Response",
      },
    };
    mock.legacyActivationModel.upsert.mockReturnValueOnce(TE.left(error));

    // when
    const result = await makeHandler(deps)({ inputs: [validBuffer] })();
    // then
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBeInstanceOf(Error);
      expect(result.left.message).toStrictEqual(error.error.message);
    }
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledOnce();
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledWith({
      fiscalCode: validActivation.fiscalCode,
      kind: "INewActivation",
      serviceId: validActivation.serviceId,
      status: "ACTIVE",
    });
  });

  it("should complete successfully when upsert do not fail", async () => {
    // given
    const validBuffer = Buffer.from(JSON.stringify(validActivation));
    mock.legacyActivationModel.upsert.mockReturnValueOnce(TE.right({}));

    // when
    const result = await makeHandler(deps)({ inputs: [validBuffer] })();
    // then
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledOnce();
    expect(mock.legacyActivationModel.upsert).toHaveBeenCalledWith({
      fiscalCode: validActivation.fiscalCode,
      kind: "INewActivation",
      serviceId: validActivation.serviceId,
      status: "ACTIVE",
    });
  });
});
