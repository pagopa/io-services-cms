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
      organization_name: "anOrganizationName",
      version: 1,
    },
  ],
} as unknown as FeaturedServices;
