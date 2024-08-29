import { Institutions } from "../../generated/definitions/internal/Institutions";

export const mockFeaturedInstitutions = {
  items: [
    {
      fiscal_code: "12345678901",
      id: "12345678901",
      name: "anInstitutionName",
    },
    {
      fiscal_code: "10385778507",
      id: "15345478961",
      name: "anotherInstitutionName",
    },
  ],
} as unknown as Institutions;
