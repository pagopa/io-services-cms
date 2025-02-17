import { faker } from "@faker-js/faker/locale/it";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bulkPatch } from "../business";

const { bulkPatchMock } = vi.hoisted(() => ({
  bulkPatchMock: vi.fn(),
}));

vi.mock("../cosmos", () => ({
  bulkPatch: bulkPatchMock,
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("bulkPatch", () => {
  it("shold throw an error when bulkPatch dependency fail", () => {
    // given
    const bulkPatchServicePayload = [
      {
        id: faker.string.uuid(),
        metadata: { group_id: faker.string.uuid() },
      },
      {
        id: faker.string.uuid(),
        metadata: { group_id: faker.string.uuid() },
      },
    ];
    const error = new Error("error message");
    bulkPatchMock.mockReturnValueOnce(TE.left(error));

    // when and then
    expect(bulkPatch(bulkPatchServicePayload)).rejects.toThrowError(error);
    expect(bulkPatchMock).toHaveBeenCalledOnce();
    expect(bulkPatchMock).toHaveBeenCalledWith(
      bulkPatchServicePayload.map((item) => ({
        id: item.id,
        data: { metadata: item.metadata },
      })),
    );
  });

  it("shold not fail", () => {
    // given
    const bulkPatchServicePayload = [
      {
        id: faker.string.uuid(),
        metadata: { group_id: faker.string.uuid() },
      },
      {
        id: faker.string.uuid(),
        metadata: { group_id: faker.string.uuid() },
      },
    ];

    bulkPatchMock.mockReturnValueOnce(
      TE.right(bulkPatchServicePayload.map((_) => ({ statusCode: 200 }))),
    );

    // when and then
    expect(bulkPatch(bulkPatchServicePayload)).resolves.toStrictEqual(
      bulkPatchServicePayload.map((item) => ({
        id: item.id,
        statusCode: 200,
      })),
    );
    expect(bulkPatchMock).toHaveBeenCalledOnce();
    expect(bulkPatchMock).toHaveBeenCalledWith(
      bulkPatchServicePayload.map((item) => ({
        id: item.id,
        data: { metadata: item.metadata },
      })),
    );
  });
});
