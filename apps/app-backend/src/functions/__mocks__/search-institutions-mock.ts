import { Institution } from "../../generated/definitions/internal/Institution";
import { OrganizationFiscalCode } from "../../generated/definitions/internal/OrganizationFiscalCode";
import { SearchMappedResult } from "../../utils/azure-search/client";

export const mockSearchInstitutionsResult: SearchMappedResult<Institution> = {
  count: 2,
  resources: [
    {
      fiscal_code: "01234567891" as OrganizationFiscalCode,
      id: "01234567891",
      name: "Institution 1",
    },
    {
      fiscal_code: "21234567891" as OrganizationFiscalCode,
      id: "21234567891",
      name: "Institution 2",
    },
  ],
};
