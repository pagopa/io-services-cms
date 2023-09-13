import {
  API_SERVICES_CMS_BASE_PATH,
  API_SERVICES_CMS_URL
} from "@/config/constants";
import { faker } from "@faker-js/faker/locale/it";
import { rest } from "msw";
import {
  aMockServiceKeys,
  aMockServicePagination,
  aMockServicePaginationLimitOffset,
  aMockServicePublication,
  getMockServiceLifecycle
} from "../data/backend-data";
import { aMockErrorResponse } from "../data/common-data";

faker.seed(1);

const baseURL = "https://mock-rest-endpoint/api/manage";
// const baseURL = API_SERVICES_CMS_URL + API_SERVICES_CMS_BASE_PATH;

export const handlers = [
  rest.get(`${baseURL}/info`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(200), ctx.json(getInfo200Response())],
      [ctx.status(500), ctx.json(getInfo500Response())]
    ];

    return res(...resultArray[0]);
  }),
  rest.post(`${baseURL}/services`, (req, res, ctx) => {
    const resultArray = [
      [ctx.status(201), ctx.json(getCreateService201Response())],
      [ctx.status(400), ctx.json(null)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.get(`${baseURL}/services`, (req, res, ctx) => {
    const offset = req.url.searchParams.get("offset");
    const limit = req.url.searchParams.get("limit");
    console.log(
      `GET ${baseURL}/services intercepted, offset: ${offset}, limit: ${limit}`
    );

    const resultArray = [
      [
        ctx.status(200),
        ctx.json(getGetServices200Response(Number(limit), Number(offset)))
      ],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
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
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
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
      [ctx.status(400), ctx.json(null)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.delete(`${baseURL}/services/:serviceId`, (_, res, ctx) => {
    console.log("DELETE /services/:serviceId intercepted");
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.put(`${baseURL}/services/:serviceId/logo`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(400), ctx.json(null)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.get(`${baseURL}/services/:serviceId/keys`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(200), ctx.json(getGetServiceKeys200Response())],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.put(`${baseURL}/services/:serviceId/keys/:keyType`, (_, res, ctx) => {
    console.log("PUT /services/:serviceId/keys/:keyType intercepted");
    const resultArray = [
      [ctx.status(200), ctx.json(getRegenerateServiceKey200Response())],
      [ctx.status(400), ctx.json(null)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.put(`${baseURL}/services/:serviceId/review`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(409), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.patch(`${baseURL}/services/:serviceId/review`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(400), ctx.json(null)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(409), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.post(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(409), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.get(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(200), ctx.json(getGetPublishedService200Response())],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  }),
  rest.delete(`${baseURL}/services/:serviceId/release`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(204)],
      [ctx.status(401), ctx.json(null)],
      [ctx.status(403), ctx.json(null)],
      [ctx.status(404), ctx.json(null)],
      [ctx.status(429), ctx.json(null)],
      [ctx.status(500), ctx.json(null)]
    ];

    return res(...resultArray[0]);
  })
];

export function getInfo200Response() {
  return {
    version: faker.lorem.slug(1),
    name: faker.person.fullName()
  };
}

export function getInfo500Response() {
  return aMockErrorResponse;
}

export function getCreateService201Response() {
  return getMockServiceLifecycle();
}

export function getGetServices200Response(limit?: number, offset?: number) {
  return aMockServicePaginationLimitOffset(limit, offset);
}

export function getGetService200Response(serviceId: string) {
  return getMockServiceLifecycle(serviceId);
}

export function getUpdateService200Response(serviceId: string) {
  return getMockServiceLifecycle(serviceId);
}

export function getGetServiceKeys200Response() {
  return aMockServiceKeys;
}

export function getRegenerateServiceKey200Response() {
  return aMockServiceKeys;
}

export function getGetPublishedService200Response() {
  return aMockServicePublication;
}

export const mockApiServicesCmsUrl = "https://mock-rest-endpoint/api/manage";
