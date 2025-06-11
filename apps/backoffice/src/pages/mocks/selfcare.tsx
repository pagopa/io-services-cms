import { getConfiguration } from "@/config";
import ArrowForward from "@mui/icons-material/ArrowForward";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";

import {
  aMockedAggregatorInstitutionIdentityToken,
  aMockedAggregatorInstitutionOperatorIdentityToken,
  aMockedChangeInstitutionIdentityToken,
  aMockedIdentityToken,
} from "../../../mocks/data/selfcare-data";

/** This is a mock page, for development purpose only */
export default function Selfcare() {
  const [currentMockIdentityToken, setCurrentMockIdentityToken] =
    useState<string>(aMockedIdentityToken);

  const handleChange = (event: SelectChangeEvent<any>) =>
    setCurrentMockIdentityToken(event.target.value);

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      justifyContent="center"
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
            <Typography gutterBottom variant="h6">
              App IO
            </Typography>
            <Typography variant="body2">
              Gestisci il prodotto per questo ente.
            </Typography>
            <Stack marginTop={3} spacing={2}>
              <FormControl sx={{ paddingX: 1.25 }}>
                <Select
                  defaultValue={aMockedIdentityToken}
                  onChange={handleChange}
                  size="small"
                  value={currentMockIdentityToken}
                >
                  <MenuItem value={aMockedIdentityToken}>
                    Amministratore
                  </MenuItem>
                  <MenuItem value={aMockedChangeInstitutionIdentityToken}>
                    Operatore
                  </MenuItem>
                  <MenuItem value={aMockedAggregatorInstitutionIdentityToken}>
                    Amministratore EA
                  </MenuItem>
                  <MenuItem
                    value={aMockedAggregatorInstitutionOperatorIdentityToken}
                  >
                    Operatore EA
                  </MenuItem>
                </Select>
              </FormControl>
              <NextLink
                href={`${
                  getConfiguration().BACK_OFFICE_LOGIN_PATH
                }#token=${currentMockIdentityToken}`}
                passHref
              >
                <Button endIcon={<ArrowForward />} variant="outlined">
                  Accedi al BackOffice IO
                </Button>
              </NextLink>
            </Stack>
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
Selfcare.publicRoute = true;
