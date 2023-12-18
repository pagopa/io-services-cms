import { getConfiguration } from "@/config";
import { faker } from "@faker-js/faker/locale/it";
import { HttpResponse, http } from "msw";
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
    http.post(`${baseURL}/services`, () => {
      const resultArray = [
        new HttpResponse(JSON.stringify(getCreateService201Response()), {
          status: 201
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(400)), {
          status: 400
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.get(`${baseURL}/services`, () => {
      const resultArray = [
        new HttpResponse(JSON.stringify(getGetServices200Response()), {
          status: 200
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.get(`${baseURL}/services/:serviceId`, ({ params }) => {
      const { serviceId } = params;
      const resultArray = [
        new HttpResponse(
          JSON.stringify(getGetService200Response(serviceId as string)),
          {
            status: 200
          }
        ),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.put(`${baseURL}/services/:serviceId`, ({ params }) => {
      const { serviceId } = params;
      const resultArray = [
        new HttpResponse(
          JSON.stringify(getUpdateService200Response(serviceId as string)),
          {
            status: 200
          }
        ),
        new HttpResponse(JSON.stringify(getIoServicesError(400)), {
          status: 400
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.delete(`${baseURL}/services/:serviceId`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.put(`${baseURL}/services/:serviceId/logo`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(400)), {
          status: 400
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.get(`${baseURL}/services/:serviceId/keys`, () => {
      const resultArray = [
        new HttpResponse(JSON.stringify(getGetServiceKeys200Response()), {
          status: 200
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.put(`${baseURL}/services/:serviceId/keys/:keyType`, () => {
      const resultArray = [
        new HttpResponse(JSON.stringify(getRegenerateServiceKey200Response()), {
          status: 200
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(400)), {
          status: 400
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.put(`${baseURL}/services/:serviceId/review`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(409)), {
          status: 409
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.patch(`${baseURL}/services/:serviceId/review`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(409)), {
          status: 409
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.post(`${baseURL}/services/:serviceId/release`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(409)), {
          status: 409
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.get(`${baseURL}/services/:serviceId/release`, () => {
      const resultArray = [
        new HttpResponse(JSON.stringify(getGetPublishedService200Response()), {
          status: 200
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    }),
    http.delete(`${baseURL}/services/:serviceId/release`, () => {
      const resultArray = [
        new HttpResponse(null, {
          status: 204
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(401)), {
          status: 401
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(403)), {
          status: 403
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(404)), {
          status: 404
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(429)), {
          status: 429
        }),
        new HttpResponse(JSON.stringify(getIoServicesError(500)), {
          status: 500
        })
      ];

      return resultArray[0];
    })
  ];
  return configuration.IS_DEVELOPMENT
    ? [
        ...handlers,
        http.get(`${baseURL}/info`, () => {
          const resultArray = [
            new HttpResponse(JSON.stringify(getInfo200Response()), {
              status: 200
            }),
            new HttpResponse(JSON.stringify(getInfo500Response()), {
              status: 500
            })
          ];

          return resultArray[0];
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
