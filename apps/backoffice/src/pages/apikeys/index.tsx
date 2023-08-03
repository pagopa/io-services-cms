import { AppLayout } from "@/layouts/app-layout";
import { PageLayout } from "@/layouts/page-layout";
import Head from "next/head";
import { ReactElement } from "react";

export default function ApiKeys() {
  return (
    <>
      <Head>
        <title>IO BackOffice | API Key</title>
      </Head>
      <main>contenuto pagina API Key</main>
    </>
  );
}

ApiKeys.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="API Key">{page}</PageLayout>
    </AppLayout>
  );
};
