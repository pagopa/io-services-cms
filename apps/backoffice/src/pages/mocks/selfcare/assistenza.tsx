import { Card, CardContent, Grid, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

/** This is a mock page, for development purpose only */
export default function Assistenza() {
  const router = useRouter();
  const { productId } = router.query;

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      justifyContent="center"
    >
      <Grid item padding={5}>
        <Typography textAlign="center" variant="h3">
          Invia una richiesta di assistenza
        </Typography>
        <Typography textAlign="center" variant="body1">
          Questa è una pagina di test visibile solo in ambiente DEV.
        </Typography>
      </Grid>
      <Grid item padding={5}>
        <Card raised sx={{ width: 300 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography gutterBottom variant="h6">
              Prodotto
            </Typography>
            <Typography variant="body2">{productId}</Typography>
          </CardContent>
        </Card>
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
Assistenza.publicRoute = true;
