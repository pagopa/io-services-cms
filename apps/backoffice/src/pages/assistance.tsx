import { AssistanceEmailForm } from "@/components/assistance-email-form";
import { PageHeader } from "@/components/headers";
import { AssistanceResponse } from "@/generated/api/AssistanceResponse";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { sanitizePath } from "@/utils/string-util";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.assistance.title";
const pageDescriptionLocaleKey = "routes.assistance.description";

export default function Assistance() {
  const { t } = useTranslation();
  const router = useRouter();
  const { callbackUrl } = router.query;
  const { data, fetchData } = useFetch<AssistanceResponse>();

  const requestAssistance = (email: string) => {
    fetchData("assistance", { body: { email } }, AssistanceResponse, {
      notify: "errors"
    });
  };

  useEffect(() => {
    if (data?.redirectUrl) window.open(data.redirectUrl, "_blank");
  }, [data]);

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
      />
      <AssistanceEmailForm
        onBack={() => router.push(sanitizePath(callbackUrl as string))}
        onComplete={requestAssistance}
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
    <AppLayout hideHeader hideSidenav hideAssistance>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
