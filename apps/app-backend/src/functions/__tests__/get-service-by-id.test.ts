import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { IConfig } from "../../config";
import {
  buildCosmosDbServiceDetails,
  buildApiResponseServiceDetails,
  mockServiceDetailsContainer,
} from "../__mocks__/get-service-by-id-mock";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeGetServiceByIdHandler } from "../get-service-by-id";
import { NotificationChannelEnum } from "../../generated/definitions/internal/NotificationChannel";
const mockedConfiguration = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 101,
  PAGINATION_MAX_OFFSET: 101,
} as unknown as IConfig;

describe("Get Service By Id Tests", () => {
  it("Should Return the requested service", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      path: {
        serviceId: "aServiceId",
      },
    };
    const serviceDetailsContainer = mockServiceDetailsContainer(
      200,
      buildCosmosDbServiceDetails(false)
    );

    const result = await makeGetServiceByIdHandler({
      ...httpHandlerInputMocks,
      input: req,
      serviceDetailsContainer,
    })();

    expect(serviceDetailsContainer.item).toBeCalledWith(
      "aServiceId",
      "aServiceId"
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            ...buildApiResponseServiceDetails([
              NotificationChannelEnum.EMAIL,
              NotificationChannelEnum.WEBHOOK,
            ]),
          },
          statusCode: 200,
        })
      )
    );
  });

  it("Should Return a 404 HTTP NOT FOUND when the service is not found in cosmosDb", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      path: {
        serviceId: "aServiceId",
      },
    };

    const serviceDetailsContainer = mockServiceDetailsContainer(404);

    const result = await makeGetServiceByIdHandler({
      ...httpHandlerInputMocks,
      input: req,
      serviceDetailsContainer,
    })();

    expect(serviceDetailsContainer.item).toBeCalledWith(
      "aServiceId",
      "aServiceId"
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 404,
            title: "Service 'aServiceId' not found",
          },
          statusCode: 404,
        })
      )
    );
  });

  it("Should Return an error in case of bad item found on cosmosb", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      path: {
        serviceId: "aServiceId",
      },
    };

    const serviceDetailsContainer = mockServiceDetailsContainer(200, {
      invalidProperty: "invalid",
    });

    const result = await makeGetServiceByIdHandler({
      ...httpHandlerInputMocks,
      input: req,
      serviceDetailsContainer,
    })();

    expect(serviceDetailsContainer.item).toBeCalledWith(
      "aServiceId",
      "aServiceId"
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: expect.stringContaining(
              `An error has occurred while decoding service having ID aServiceId [`
            ),
          },
          statusCode: 500,
        })
      )
    );
  });

  it("Should Return an internal server error in case of cosmosb error response", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      path: {
        serviceId: "aServiceId",
      },
    };

    const serviceDetailsContainer = mockServiceDetailsContainer(
      500,
      null,
      "An error occurred",
      true
    );

    const result = await makeGetServiceByIdHandler({
      ...httpHandlerInputMocks,
      input: req,
      serviceDetailsContainer,
    })();

    expect(serviceDetailsContainer.item).toBeCalledWith(
      "aServiceId",
      "aServiceId"
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `An error has occurred while fetching service having ID aServiceId [An error occurred]`,
          },
          statusCode: 500,
        })
      )
    );
  });
});
