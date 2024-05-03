import { FeaturedItems } from "../../generated/definitions/internal/FeaturedItems";

export const mockFeaturedItems = {
  items: [
    {
      id: "aServiceId",
      name: "aServiceName",
      version: 1,
    },
    {
      id: "12345678901",
      name: "anInstitutionName",
      fiscal_code: "12345678901",
    },
    {
      id: "anotherServiceId",
      name: "aServiceName",
      version: 1,
      organization_name: "anOrganizationName",
    },
  ],
} as unknown as FeaturedItems;
