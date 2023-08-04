import { PageHtmlHeadTitle } from "@/components/utils/page-html-head-title";
import { AppLayout, PageLayout } from "@/layouts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section="overview" />
      <main>{t("test")}</main>
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

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="Panoramica">{page}</PageLayout>
    </AppLayout>
  );
};
