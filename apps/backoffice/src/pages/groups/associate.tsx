import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.groups.associate.title";
const pageDescriptionLocaleKey = "routes.groups.associate.description";

export default function AssociateGroups() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push("/services")}
        showExit
        title={pageTitleLocaleKey}
      />
      {t("TODO")}
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
