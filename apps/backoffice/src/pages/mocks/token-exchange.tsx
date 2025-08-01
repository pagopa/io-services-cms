import { getConfiguration } from "@/config";
import { isNullUndefinedOrEmpty } from "@/utils/string-util";
import { Grid, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";

import { aMockedChangeInstitutionIdentityToken } from "../../../mocks/data/selfcare-data";

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
    // TODO: can be used !NonEmptyString.is(institutionId) && !NonEmptyString.is(productId)??
    if (
      !(
        isNullUndefinedOrEmpty(institutionId as string) &&
        isNullUndefinedOrEmpty(productId as string)
      )
    ) {
      console.log("token-exchange");
      router.push(
        `${
          getConfiguration().BACK_OFFICE_LOGIN_PATH
        }#token=${aMockedChangeInstitutionIdentityToken}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, productId]);

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      justifyContent="center"
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
  if (process.env.APP_ENV === "production") {
    return { notFound: true };
  }
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

// No Auth required
TokenExchange.publicRoute = true;
