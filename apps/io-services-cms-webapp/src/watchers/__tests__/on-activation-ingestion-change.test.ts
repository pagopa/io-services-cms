import { Activation } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { describe, it, expect, vi, afterEach } from "vitest";
import { parseBlob } from "../on-activation-ingestion-change";

const mocks = vi.hoisted(() => {
  return {
    log: vi.fn(),
    createIngestionBlobTriggerHandler: vi.fn(),
    enricher: vi.fn(),
    avroActivationFormatter: vi.fn(),
    producer: vi.fn(),
  };
});

vi.mock("../../lib/azure/misc", () => ({
  log: mocks.log,
}));
vi.mock("../../utils/ingestion/ingestion-handlers", () => ({
  createIngestionBlobTriggerHandler: mocks.createIngestionBlobTriggerHandler,
}));
vi.mock("../../utils/ingestion/enricher/pdv-enricher", () => ({
  enricher: mocks.enricher,
}));
vi.mock("../../utils/ingestion/formatter/activation-avro-formatter", () => ({
  avroActivationFormatter: mocks.avroActivationFormatter,
}));

describe("parseBlob", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockProcessItems = vi.fn(RTE.right("Processed OK"));

  const mockContext = { log: mocks.log } as any;

  it("should successfully parse, decode, and process a valid blob", async () => {
    //given
    const inputData = {
      fiscalCode: "DRMLRD84H15H282A",
      serviceId: "service1",
      status: "ACTIVE",
      modifiedAt: 1751901650032,
    };

    const blob = Buffer.from(JSON.stringify(inputData));
    const azureFunctionCall = { context: mockContext, inputs: [blob] };
    //when
    const resultTask = parseBlob()(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isRight(result)).toBe(true);
    expect(E.getOrElseW(() => "")(result)).toBe("Processed OK");

    expect(mockProcessItems).toHaveBeenCalledWith({
      items: [inputData],
    });
  });

  it("should fail and log if the blob contains invalid JSON", async () => {
    //given
    const blob = Buffer.from("{ invalid-json }");
    const azureFunctionCall = { context: mockContext, inputs: [blob] };

    //when
    const resultTask = parseBlob()(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      const errorMessageCheck = result.left.message.startsWith(
        "Failed parsing the blob",
      );
      expect(errorMessageCheck).toBe(true);
    }

    expect(mockProcessItems).not.toHaveBeenCalled();
  });

  it("should fail and log if the JSON fails schema decoding", async () => {
    //given
    const inputData = { fiscalCode: "short", last_update: "bad-date" };

    const blob = Buffer.from(JSON.stringify(inputData));
    const azureFunctionCall = { context: mockContext, inputs: [blob] };

    //when
    const resultTask = parseBlob()(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      const errorMessageCheck = result.left.message.startsWith(
        "Failed parsing the blob",
      );
      expect(errorMessageCheck).toBe(true);
    }
    expect(mockProcessItems).not.toHaveBeenCalled();
  });
});
