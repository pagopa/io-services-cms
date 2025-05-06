import { BackOfficeUserEnriched } from "@/lib/be/wrappers";

//FIXME: remove this workaround for managing the creation and the update of services from pagopa
//        where the name of the organization needs to be renamed into "IO - L'app dei servizi pubblici"
const PAGOPA_ORGANIZATION_NAME = "IO - L'app dei servizi pubblici";
const PAGOPA_ORGANIZATION_FISCAL_CODE = "15376371009";

export const getServiceOrganizationName = (
  institution: BackOfficeUserEnriched["institution"],
): string =>
  institution.fiscalCode === PAGOPA_ORGANIZATION_FISCAL_CODE
    ? PAGOPA_ORGANIZATION_NAME
    : institution.name;
