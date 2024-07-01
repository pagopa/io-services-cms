import { FeaturedServices } from "../../generated/definitions/internal/FeaturedServices";

export const mockFeaturedServices = {
  items: [
    {
      id: "aServiceId",
      name: "aServiceName",
      version: 1,
    },
    {
      id: "anotherServiceId",
      name: "anotherServiceName",
      version: 1,
      organization_name: "anOrganizationName",
    },
  ],
} as unknown as FeaturedServices;
