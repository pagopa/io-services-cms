import { PageHeader } from "@/components/headers";
import { ServiceCreateUpdate } from "@/components/services/service-create-update";
import { AppLayout, PageLayout } from "@/layouts";
import { ServicePayload } from "@/types/service";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.new-service.title";
const pageDescriptionLocaleKey = "routes.new-service.description";

export default function NewService() {
  const { t } = useTranslation();

  const handleConfirm = (service: ServicePayload) => {
    console.log("service", service);
    // TODO conversion from FE ServicePayload to API ServicePayload
  };

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <ServiceCreateUpdate mode="create" onConfirm={handleConfirm} />
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}

NewService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
