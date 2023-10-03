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
        <Typography textAlign="center" variant="h3">
          Prodotti attivi
        </Typography>
        <Typography textAlign="center" variant="body1">
          Questa è una pagina di test visibile solo in ambiente DEV.
        </Typography>
      </Grid>
      <Grid item padding={5}>
        <Card raised sx={{ width: 300 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              App IO
            </Typography>
            <Typography variant="body2">
              Gestisci il prodotto per questo ente.
            </Typography>
            <Box marginTop={3}>
              <NextLink
                href="/auth/login#token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ1aWRfMTIzNDUiLCJhdWQiOiJpby5zZWxmY2FyZS5wYWdvcGEuaXQiLCJpc3MiOiJodHRwOi8vc2VsZmNhcmUucGFnb3BhLml0IiwiaWF0IjoxNjk1MTE1NzM5LCJleHAiOjE2OTYxMTU3MzksImp0aSI6IjAxRkdTSDJCMzRIRlQzN1g0U0ozWFoyVllaIiwibmFtZSI6Ik1hcmlvIiwiZmFtaWx5X25hbWUiOiJSb3NzaSIsImZpc2NhbF9udW1iZXIiOiJHRE5OV0ExMkg4MVk4NzRGIiwiZW1haWwiOiJlbWFpbEBleGFtcGxlLmNvbSIsImRlc2lyZWRfZXhwIjoxNjMzNTI5MTgyLCJvcmdhbml6YXRpb24iOnsiaWQiOiJpbnRlcm5hbElEIiwiZmlzY2FsX2NvZGUiOiJvcmdhbml6YXRpb24gZmlzY2FsIG9yIHZhdCBudW1iZXIiLCJuYW1lIjoiT3JnYW5pemF0aW9uIGxlZ2FsIG5hbWUiLCJyb2xlcyI6W3sicGFydHlSb2xlIjoiT1BFUkFUT1IiLCJyb2xlIjoic2VjdXJpdHkifSx7InBhcnR5Um9sZSI6Ik9QRVJBVE9SIiwicm9sZSI6ImFwaSJ9XSwiZ3JvdXBzIjpbImludGVybmFsR3JvdXBJZC0xIiwiaW50ZXJuYWxHcm91cElkLTIiXX19.xPLX9D6khl4yCw5RDhsx9ZXJBJpSzol3HGs_FRKrCY4"
                passHref
              >
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
Selfcare.publicRoute = true;
