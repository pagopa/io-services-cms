import { PageHtmlHeadTitle } from "@/components/utils/page-html-head-title";
import { AppLayout, PageLayout } from "@/layouts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

export default function ApiKeys() {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section="apikeys" />
      <main>contenuto pagina API Key</main>
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

ApiKeys.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="API Key">{page}</PageLayout>
    </AppLayout>
  );
};
