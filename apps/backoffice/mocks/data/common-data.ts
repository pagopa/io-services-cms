import { faker } from "@faker-js/faker/locale/it";

export const aMockErrorResponse = {
  type: "https://example.com/problem/constraint-violation",
  title: "Service Unavailable",
  status: 200,
  detail: "There was an error processing the request",
  instance: faker.internet.url()
};
