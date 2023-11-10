import { getConfiguration } from "@/config";
import { faker } from "@faker-js/faker/locale/it";
import { rest } from "msw";
import {
  aMockServicePaginationLimitOffset,
  aMockServicePublication,
  getIoServicesError,
  getMockServiceKeys,
  getMockServiceLifecycle
} from "../data/backend-data";
import { aMockErrorResponse } from "../data/common-data";

faker.seed(1);

export const buildHandlers = () => {
  const configuration = getConfiguration();
  const baseURL =
    configuration.API_SERVICES_CMS_URL +
    configuration.API_SERVICES_CMS_BASE_PATH;

  const handlers = [
    rest.post(`${baseURL}/services`, (req, res, ctx) => {
      const resultArray = [
        [ctx.status(201), ctx.json(getCreateService201Response())],
        [ctx.status(400), ctx.json(getIoServicesError(400))],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.get(`${baseURL}/services`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(200), ctx.json(getGetServices200Response())],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.get(`${baseURL}/services/:serviceId`, (req, res, ctx) => {
      const { serviceId } = req.params;
      const resultArray = [
        [
          ctx.status(200),
          ctx.json(getGetService200Response(serviceId as string))
        ],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(404), ctx.json(getIoServicesError(404))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.put(`${baseURL}/services/:serviceId`, (req, res, ctx) => {
      const { serviceId } = req.params;
      const resultArray = [
        [
          ctx.status(200),
          ctx.json(getUpdateService200Response(serviceId as string))
        ],
        [ctx.status(400), ctx.json(getIoServicesError(400))],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(404), ctx.json(getIoServicesError(404))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.delete(`${baseURL}/services/:serviceId`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(404), ctx.json(getIoServicesError(404))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.put(`${baseURL}/services/:serviceId/logo`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(400), ctx.json(getIoServicesError(400))],
        [ctx.status(401), ctx.json(getIoServicesError(401))],
        [ctx.status(403), ctx.json(getIoServicesError(403))],
        [ctx.status(404), ctx.json(getIoServicesError(404))],
        [ctx.status(429), ctx.json(getIoServicesError(429))],
        [ctx.status(500), ctx.json(getIoServicesError(500))]
      ];

      return res(...resultArray[0]);
    }),
    rest.get(`${baseURL}/services/:serviceId/keys`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(200), ctx.json(getGetServiceKeys200Response())],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    }),
    rest.put(`${baseURL}/services/:serviceId/keys/:keyType`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(200), ctx.json(getRegenerateServiceKey200Response())],
        [ctx.status(400), ctx.json(getIoServicesError(400))],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    }),
    rest.put(`${baseURL}/services/:serviceId/review`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(409), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    }),
    rest.patch(`${baseURL}/services/:serviceId/review`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(400), ctx.json(getIoServicesError(400))],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(409), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    }),
    rest.post(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(409), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    }),
    rest.get(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(200), ctx.json(getGetPublishedService200Response())],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(404))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[3]);
    }),
    rest.delete(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
      const resultArray = [
        [ctx.status(204)],
        [ctx.status(401), ctx.json(getIoServicesError(400))],
        [ctx.status(403), ctx.json(getIoServicesError(400))],
        [ctx.status(404), ctx.json(getIoServicesError(400))],
        [ctx.status(429), ctx.json(getIoServicesError(400))],
        [ctx.status(500), ctx.json(getIoServicesError(400))]
      ];

      return res(...resultArray[0]);
    })
  ];
  return configuration.IS_DEVELOPMENT
    ? [
        ...handlers,
        rest.get(`${baseURL}/info`, (_, res, ctx) => {
          const resultArray = [
            [ctx.status(200), ctx.json(getInfo200Response())],
            [ctx.status(500), ctx.json(getInfo500Response())]
          ];

          return res(...resultArray[0]);
        })
      ]
    : handlers;
};

function getInfo200Response() {
  return {
    version: faker.lorem.slug(1),
    name: faker.person.fullName()
  };
}

function getInfo500Response() {
  return aMockErrorResponse;
}

function getCreateService201Response() {
  return getMockServiceLifecycle();
}

function getGetServices200Response(limit?: number, offset?: number) {
  return aMockServicePaginationLimitOffset(limit, offset);
}

function getGetService200Response(serviceId: string) {
  return getMockServiceLifecycle(serviceId);
}

function getUpdateService200Response(serviceId: string) {
  return getMockServiceLifecycle(serviceId);
}

function getGetServiceKeys200Response() {
  return getMockServiceKeys();
}

function getRegenerateServiceKey200Response() {
  return getMockServiceKeys();
}

function getGetPublishedService200Response() {
  return aMockServicePublication;
}
