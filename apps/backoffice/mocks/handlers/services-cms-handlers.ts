import { faker } from "@faker-js/faker/locale/it";
import { rest } from "msw";
import { aMockErrorResponse } from "../data/common-data";

export const mockApiServicesCmsUrl = "http://mock-rest-endpoint/api/manage";

export const handlers = [
  rest.get(`${mockApiServicesCmsUrl}/info`, (_, res, ctx) => {
    const resultArray = [
      [ctx.status(200), ctx.json(getInfo200Response())],
      [ctx.status(500), ctx.json(getInfo500Response())]
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
