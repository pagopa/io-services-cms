//FIXME: remove this workaround for managing the creation and the update of services from pagopa
//        where the name of the organization needs to be renamed into "IO - L'app dei servizi pubblici"
const PAGOPA_ORGANIZATION_NAME = "IO - L'app dei servizi pubblici";
const PAGOPA_ORGANIZATION_FISCAL_CODE = "15376371009";

export const renamePagoPAServicesOrganizationName = (
  fiscalCode: string,
  organizationName: string,
): string =>
  fiscalCode === PAGOPA_ORGANIZATION_FISCAL_CODE
    ? (PAGOPA_ORGANIZATION_NAME as string)
    : (organizationName as string);
