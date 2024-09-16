import { ServiceMinified } from "../../generated/definitions/internal/ServiceMinified";
import { SearchMappedResult } from "../../utils/azure-search/client";

export const mockSearchServicesResult: SearchMappedResult<ServiceMinified> = {
  count: 2,
  resources: [
    {
      id: "01HKCDP7542ABQTNXGSFDXTG24",
      name: "Service 1",
      version: 1,
    },
    {
      id: "01HKCDP7542ABQTNXGSFDXTG25",
      name: "Service 2",
      version: 2,
    },
  ],
};
