import { AssistanceEmailForm } from "@/components/assistance-email-form";
import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { sanitizePath } from "@/utils/string-util";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.assistance.title";
const pageDescriptionLocaleKey = "routes.assistance.description";

export default function Assistance() {
  const { t } = useTranslation();
  const router = useRouter();
  const { callbackUrl } = router.query;

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
      />
      <AssistanceEmailForm
        onBack={() => router.push(sanitizePath(callbackUrl as string))}
        onComplete={email => console.log("onComplete", email)}
      />
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

Assistance.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideHeader hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
