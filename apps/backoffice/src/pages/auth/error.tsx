import { LoaderFullscreen } from "@/components/loaders";
import { trackLoginErrorEvent } from "@/utils/mix-panel";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";

export default function ErrorPage() {
  const router = useRouter();
  const error = router.query.error as string;

  useEffect(() => {
    if (router.isReady) {
      trackLoginErrorEvent(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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
