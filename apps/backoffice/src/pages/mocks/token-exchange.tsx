import { isNullUndefinedOrEmpty } from "@/utils/string-util";
import { Grid, Typography } from "@mui/material";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Selfcare change institution page.
 * This page simulate the institution change _(triggered by top-right selector on all pages)_.
 *
 * This is a mock page, for development purpose only */
export default function TokenExchange() {
  const router = useRouter();
  const { institutionId, productId } = router.query;

  useEffect(() => {
    // just a simple check on token exchange required query params
    if (
      !(
        isNullUndefinedOrEmpty(institutionId as string) &&
        isNullUndefinedOrEmpty(productId as string)
      )
    ) {
      console.log("token-exchange");
      router.push("/auth/login#token=sample_test_token");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, productId]);

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Grid item padding={5}>
        <Typography textAlign="center" variant="h3">
          Token exchange per cambio Ente
        </Typography>
        <Typography textAlign="center" variant="body1">
          Questa è una pagina di test visibile solo in ambiente DEV.
        </Typography>
      </Grid>
    </Grid>
  );
}

export async function getStaticProps({ locale }: any) {
  // ! return a not found error in prod environemnt
  if (process.env.NODE_ENV === "production") {
    return { notFound: true };
  }
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}

// No Auth required
TokenExchange.publicRoute = true;
