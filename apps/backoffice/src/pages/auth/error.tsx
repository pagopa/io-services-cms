import { LoaderFullscreen } from "@/components/loaders";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function ErrorPage() {
  const router = useRouter();
  const error = router.query.error as string;

  return (
    <LoaderFullscreen content={error} loading={false} title="auth.error" />
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

// No Auth required
ErrorPage.publicRoute = true;
