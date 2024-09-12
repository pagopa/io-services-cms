import { LoaderFullscreen } from "@/components/loaders";
import { getConfiguration } from "@/config";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";

export default function Login() {
  const router = useRouter();
  const { data: session } = useSession();

  /** get token from url after `#` char */
  const getToken = () => {
    const hash = router.asPath.split("#")[1];
    const parsedHash = new URLSearchParams(hash);
    return parsedHash.get("token");
  };

  /**
   * Handle identity
   * 1. Get id token from url and check it
   * 2. Signin with received Selfcare identity token */
  const handleIdentity = async () => {
    const identity_token = getToken();

    if (identity_token === null) {
      // redirect to selfcare
      router.push(getConfiguration().SELFCARE_URL);
      return;
    }

    // next-auth signIn to specified CredentialsProvider id (defined in [...nextauth]/route.ts)
    await signIn("access-control", {
      callbackUrl: "/",
      identity_token,
      //redirect: false
    });
  };

  useEffect(() => {
    if (session && router.isReady) {
      // redirect to the return url or home page
      // router.push((router.query.returnUrl as string) || "/");
      router.push("/");
    } else {
      handleIdentity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, router]);

  return <LoaderFullscreen content="auth.loading" title="app.title" />;
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
Login.publicRoute = true;
