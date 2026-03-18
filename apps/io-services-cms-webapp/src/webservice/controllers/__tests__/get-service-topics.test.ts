import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import {
  applyRequestMiddelwares,
  makeGetServiceTopicsHandler,
} from "../get-service-topics";
import { ServiceTopicDao } from "../../../utils/service-topic-dao";

vi.mock("../../lib/clients/apim-client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

const { context: mockContext } = makeInvocationContext();

const handler = (serviceTopicDao: any) =>
  applyRequestMiddelwares(makeGetServiceTopicsHandler({ serviceTopicDao }));
const makeRequest = (serviceTopicDao: ServiceTopicDao) =>
  handler(serviceTopicDao)(mockHttpRequest({}), mockContext);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServiceTopics", () => {
  it("should retrieve the service topics list", async () => {
    const mockServiceTopicDao = {
      findAllNotDeletedTopics: vi.fn(() =>
        TE.right([{ id: 1, name: "aTopicName" }]),
      ),
    } as any;

    const response = await makeRequest(mockServiceTopicDao);

    expect(response.jsonBody).toMatchObject({
      topics: [{ id: 1, name: "aTopicName" }],
    });
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("handle no topics found", async () => {
    const mockServiceTopicDao = {
      findAllNotDeletedTopics: vi.fn(() => TE.right([])),
    } as any;

    const response = await makeRequest(mockServiceTopicDao);

    expect(response.jsonBody).toMatchObject({
      topics: [],
    });
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("handle error retrieving topics", async () => {
    const mockServiceTopicDao = {
      findAllNotDeletedTopics: vi.fn(() => TE.left(new Error("an error"))),
    } as any;

    const response = await makeRequest(mockServiceTopicDao);

    expect(response.jsonBody).toMatchObject({
      detail: "An error occurred while fetching topics",
      status: 500,
      title: "Internal server error",
    });
    expect(mockContext.error).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
  });
});
