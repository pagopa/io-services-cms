import { LoaderFullscreen } from "@/components/loaders";
import { getConfiguration } from "@/config";
import { GetStaticProps } from "next";
import { signOut } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    signOut({ callbackUrl: getConfiguration().SELFCARE_URL });
  }, []);

  return <LoaderFullscreen content="auth.leaving" title="app.title" />;
}

export const getStaticProps: GetStaticProps = async ({ locale = "it" }) => ({
  props: {
    ...(await serverSideTranslations(locale)),
  },
});
