import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { describe, it, expect, vi, afterEach } from "vitest";
import { handler, parseBlob } from "../on-activation-ingestion-change";
import { EventHubProducerClient } from "@azure/event-hubs";
import { PdvTokenizerClient } from "../../utils/pdvTokenizerClient";
import { Activations } from "@io-services-cms/models";
import { FiscalCode } from "../../generated/api/FiscalCode";

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
    const resultTask = parseBlob(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toBe("Processed OK");
    }

    expect(mockProcessItems).toHaveBeenCalledWith({
      items: [inputData],
    });
  });

  it("should fail and log if the blob contains invalid JSON", async () => {
    //given
    const blob = Buffer.from("{ invalid-json }");
    const azureFunctionCall = { context: mockContext, inputs: [blob] };

    //when
    const resultTask = parseBlob(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      const errorMessageCheck = result.left.message.startsWith(
        "Invalid JSON content",
      );
      expect(errorMessageCheck).toBe(true);
    }

    expect(mockProcessItems).not.toHaveBeenCalled();
  });

  it("should fail and log if the JSON fails schema decoding", async () => {
    //given
    const inputData = {
      fiscalCode: "shortFiscalCode",
      last_update: "bad-date",
    };

    const blob = Buffer.from(JSON.stringify(inputData));
    const azureFunctionCall = { context: mockContext, inputs: [blob] };

    //when
    const resultTask = parseBlob(mockProcessItems)(azureFunctionCall);
    const result = await resultTask();

    //then
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      const errorMessage = result.left.message;
      // Check for the specific errors you expect, regardless of order
      expect(errorMessage).toContain("at [root.fiscalCode] is not a valid");
      expect(errorMessage).toContain("at [root.modifiedAt] is not a valid");
      expect(errorMessage).toContain("at [root.serviceId] is not a valid");
    }
    expect(mockProcessItems).not.toHaveBeenCalled();
  });
});

describe("handler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockProducer = {
    sendBatch: vi.fn(() => Promise.resolve()),
  } as unknown as EventHubProducerClient;

  const mockPdvTokenizerClient = {} as PdvTokenizerClient;

  const testFiscalCode1: FiscalCode = "RSSMRA80T01H501K" as FiscalCode;
  const testFiscalCode2: FiscalCode = "RSSMRA80T02H501M" as FiscalCode;
  const normalFiscalCode: FiscalCode = "RSSMRA80T03H501N" as FiscalCode;

  const prefixCfTest = "LVTEST00";

  const createActivation = (
    fiscalCode: FiscalCode,
  ): Activations.Activation => ({
    fiscalCode,
    serviceId: "service1" as Activations.Activation["serviceId"],
    status: "ACTIVE" as Activations.Activation["status"],
    modifiedAt: 1751901650032 as Activations.Activation["modifiedAt"],
  });

  // Mock createIngestionBlobTriggerHandler to simulate the filter function
  let capturedFilter:
    | ((activation: Activations.Activation) => boolean)
    | undefined;
  mocks.createIngestionBlobTriggerHandler.mockImplementation(
    (_producer, _formatter, _enricher, filter) => {
      capturedFilter = filter;
      return RTE.right([{}]);
    },
  );

  it("should filter 2 test fiscal codes from activations", async () => {
    const filterTestFiscalCodes = [testFiscalCode1, testFiscalCode2];
    const prefixesCfTest = [prefixCfTest];

    const activations = [
      createActivation(testFiscalCode1),
      createActivation(testFiscalCode2),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(mocks.createIngestionBlobTriggerHandler).toHaveBeenCalledOnce();
    expect(capturedFilter).toBeDefined();

    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCode1))).toBe(false);
      expect(capturedFilter(createActivation(testFiscalCode2))).toBe(false);
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should not remove any fiscal codes from activations", async () => {
    const filterTestFiscalCodes = [testFiscalCode1];
    const prefixesCfTest = [prefixCfTest];

    const activations = [createActivation(normalFiscalCode)];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should handle empty test fiscal codes list and not remove any fiscal codes from activations", async () => {
    const filterTestFiscalCodes: readonly FiscalCode[] = [];
    const prefixesCfTest = [prefixCfTest];

    const activations = [
      createActivation(testFiscalCode1),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCode1))).toBe(true);
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should filter fiscal codes that start with prefix of a fiscal code", async () => {
    const filterTestFiscalCodes: readonly FiscalCode[] = [];
    const prefixesCfTest = [prefixCfTest];
    const testFiscalCodeWithPrefix: FiscalCode =
      "LVTEST00A00A014X" as FiscalCode;

    const activations = [
      createActivation(testFiscalCodeWithPrefix),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCodeWithPrefix))).toBe(
        false,
      );
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should filter fiscal codes that start with any prefix of fiscal codes", async () => {
    const filterTestFiscalCodes: readonly FiscalCode[] = [];
    const prefixesCfTest = [prefixCfTest, "EEEEEE"];
    const testFiscalCodeWithPrefix1: FiscalCode =
      "LVTEST00A00A014X" as FiscalCode;
    const testFiscalCodeWithPrefix2: FiscalCode =
      "EEEEEE00E00E000A" as FiscalCode;

    const activations = [
      createActivation(testFiscalCodeWithPrefix1),
      createActivation(testFiscalCodeWithPrefix2),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCodeWithPrefix1))).toBe(
        false,
      );
      expect(capturedFilter(createActivation(testFiscalCodeWithPrefix2))).toBe(
        false,
      );
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should handle empty prefixes array and not filter by prefix", async () => {
    const filterTestFiscalCodes: readonly FiscalCode[] = [testFiscalCode1];
    const emptyPrefixes: string[] = [];
    const testFiscalCodeWithPrefix: FiscalCode =
      "LVTEST00A00A014X" as FiscalCode;

    const activations = [
      createActivation(testFiscalCode1),
      createActivation(testFiscalCodeWithPrefix),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      emptyPrefixes,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCode1))).toBe(false);
      expect(capturedFilter(createActivation(testFiscalCodeWithPrefix))).toBe(
        true,
      );
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });

  it("should filter fiscal codes from both list and prefix matches", async () => {
    const filterTestFiscalCodes: readonly FiscalCode[] = [testFiscalCode1];
    const prefixesCfTest = [prefixCfTest];
    const testFiscalCodeWithPrefix: FiscalCode =
      "LVTEST00A00A014X" as FiscalCode;

    const activations = [
      createActivation(testFiscalCode1),
      createActivation(testFiscalCodeWithPrefix),
      createActivation(normalFiscalCode),
    ];

    const handlerInstance = handler(
      mockProducer,
      mockPdvTokenizerClient,
      filterTestFiscalCodes,
      prefixesCfTest,
    );

    await handlerInstance({ items: activations })();

    expect(capturedFilter).toBeDefined();
    if (capturedFilter) {
      expect(capturedFilter(createActivation(testFiscalCode1))).toBe(false);
      expect(capturedFilter(createActivation(testFiscalCodeWithPrefix))).toBe(
        false,
      );
      expect(capturedFilter(createActivation(normalFiscalCode))).toBe(true);
    }
  });
});
