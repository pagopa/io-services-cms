import { AppLayout, PageLayout } from "@/layouts";
import Head from "next/head";
import { ReactElement } from "react";

export default function Home() {
  return (
    <>
      <Head>
        <title>IO BackOffice | Panoramica</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>contenuto pagina panoramica</main>
    </>
  );
}

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="Panoramica">{page}</PageLayout>
    </AppLayout>
  );
};
