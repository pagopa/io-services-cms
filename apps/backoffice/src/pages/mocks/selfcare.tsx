import ArrowForward from "@mui/icons-material/ArrowForward";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography
} from "@mui/material";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";

/** This is a mock page, for development purpose only */
export default function Selfcare() {
  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Grid item padding={5}>
        <Typography textAlign="center" variant="h3" marginBottom={5}>
          Prodotti attivi
        </Typography>
        <Card raised sx={{ minWidth: 275, maxWidth: 300 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              App IO
            </Typography>
            <Typography variant="body2">
              Gestisci il prodotto per questo ente.
            </Typography>
            <Box marginTop={3}>
              <NextLink href="/auth/login#token=sample_test_token" passHref>
                <Button variant="outlined" endIcon={<ArrowForward />}>
                  Accedi al BackOffice IO
                </Button>
              </NextLink>
            </Box>
          </CardContent>
        </Card>
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
