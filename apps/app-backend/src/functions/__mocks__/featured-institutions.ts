import { Institutions } from "../../generated/definitions/internal/Institutions";

export const mockFeaturedInstitutions = {
  items: [
    {
      id: "12345678901",
      name: "anInstitutionName",
      fiscal_code: "12345678901",
    },
    {
      id: "15345478961",
      name: "anotherInstitutionName",
      fiscal_code: "10385778507",
    },
  ],
} as unknown as Institutions;
