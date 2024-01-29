import { LoaderFullscreen } from "@/components/loaders";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

export default function ErrorPage() {
  const router = useRouter();
  const error = router.query.error as string;

  return (
    <LoaderFullscreen title="auth.error" content={error} loading={false} />
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

// No Auth required
ErrorPage.publicRoute = true;
