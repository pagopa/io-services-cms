import { LoaderFullscreen } from "@/components/loaders";
import {
  API_BACKEND_BASE_PATH,
  API_BACKEND_BASE_URL,
  SELFCARE_URL
} from "@/config/constants";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
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
   * 2. Resolve Selfcare identity
   * 3. Signin with received jwt session token */
  const handleIdentity = async () => {
    const identity_token = getToken();

    if (identity_token === null) {
      // redirect to selfcare
      router.push(SELFCARE_URL);
      return;
    }

    // resolve selfcare identity
    const { data, status } = await axios.post<any>(
      `${API_BACKEND_BASE_URL}${API_BACKEND_BASE_PATH}/auth`,
      { identity_token }
    );

    if (status === 200 && data) {
      console.log("auth ok");
      await signIn("access-control", {
        session_token: data,
        callbackUrl: "/"
        //redirect: false
      });
    } else {
      console.warn("auth ko", status, data); // TODO: placeholder log, will be removed
    }
  };

  useEffect(() => {
    if (session && router.isReady) {
      setTimeout(() => {
        // redirect to the return url or home page
        router.push((router.query.returnUrl as string) || "/");
      }, 2000);
    } else {
      handleIdentity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, router]);

  return <LoaderFullscreen title="app.title" content="auth.loading" />;
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}
