import { LoaderFullscreen } from "@/components/loaders";
import { getConfiguration } from "@/config";
import { signOut } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    signOut({ callbackUrl: getConfiguration().SELFCARE_URL });
  }, []);

  return <LoaderFullscreen title="app.title" content="auth.leaving" />;
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}
