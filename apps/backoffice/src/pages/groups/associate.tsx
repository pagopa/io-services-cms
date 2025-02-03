import { AssociateGroupsCreateUpdate } from "@/components/groups/associate-groups-create-update";
import { PageHeader } from "@/components/headers";
import { BulkPatchServicePayload } from "@/generated/api/BulkPatchServicePayload";
import { BulkPatchServiceResponse } from "@/generated/api/BulkPatchServiceResponse";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.groups.associate.title";
const pageDescriptionLocaleKey = "routes.groups.associate.description";
const servicesPageUrl = "/services";

export default function AssociateGroups() {
  const router = useRouter();
  const { fetchData: bulkAssociateServicesFetchData } =
    useFetch<BulkPatchServiceResponse>();

  const handleConfirm = async (
    groupAssociatedServices: BulkPatchServicePayload,
  ) => {
    await bulkAssociateServicesFetchData(
      "bulkPatchServices",
      { body: groupAssociatedServices },
      BulkPatchServiceResponse,
      { notify: "all" },
    );
    // redirect to services page
    router.push(servicesPageUrl);
  };

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push(servicesPageUrl)}
        showExit
        title={pageTitleLocaleKey}
      />
      <AssociateGroupsCreateUpdate onConfirm={handleConfirm} />
    </>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

AssociateGroups.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};

AssociateGroups.requiredRole = "admin";
