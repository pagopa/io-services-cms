import ArrowForward from "@mui/icons-material/ArrowForward";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography
} from "@mui/material";
import { GetStaticPaths } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { useRouter } from "next/router";

/** This is a mock page, for development purpose only */
export default function SelfcareUsers() {
  const router = useRouter();
  const institutionId = router.query.institutionId as string;

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Grid item padding={5}>
        <Typography textAlign="center" variant="h3">
          Utenti
        </Typography>
        <Typography textAlign="center" variant="body1">
          Questa è una pagina di test visibile solo in ambiente DEV.
        </Typography>
      </Grid>
      <Grid item padding={5}>
        <Card raised sx={{ width: 400 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Id Ente:
            </Typography>
            <Typography variant="body2">{institutionId}</Typography>
            <Box marginTop={3}>
              <NextLink href={`/`} passHref>
                <Button variant="outlined" endIcon={<ArrowForward />}>
                  Torna al BackOffice IO
                </Button>
              </NextLink>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export const getStaticPaths: GetStaticPaths<{
  institutionId: string;
}> = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: "blocking" //indicates the type of fallback
  };
};

export async function getStaticProps({ locale }: any) {
  // ! return a not found error in prod environemnt
  if (process.env.APP_ENV === "production") {
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
SelfcareUsers.publicRoute = true;
