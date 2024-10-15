import { ButtonCancel, ButtonNext } from "@/components/buttons";
import { useDialog } from "@/components/dialog-provider";
import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import {
  Box,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";
import React from "react";

const pageTitleLocaleKey = "routes.keys.new-group-api-key.title";
const pageDescriptionLocaleKey = "routes.keys.new-group-api-key.description";

export default function NewGroupApiKey() {
  const { t } = useTranslation();
  const router = useRouter();

  const showDialog = useDialog();
  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      console.log("operation cancelled");
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const handleConfirm = () => {
    //TODO new api logic
    router.back();
  };

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push("/services")}
        showExit
        title={pageTitleLocaleKey}
        titleVariant="h2"
      />
      <Box bgcolor="background.paper" borderRadius="4px" padding="24px">
        <Typography marginBottom={2} variant="h6">
          {t("routes.keys.new-group-api-key.card.title")}
        </Typography>
        <Typography marginBottom={2} variant="body2">
          {t("routes.keys.new-group-api-key.card.description")}
        </Typography>
        <Typography
          color={"error"}
          fontWeight={600}
          marginBottom={2}
          variant="body2"
        >
          {t("routes.keys.new-group-api-key.card.hint")}
        </Typography>
        <Box>
          <Stack alignItems="center" direction="row" gap={1} marginBottom={2}>
            <SupervisedUserCircleIcon />
            <Typography variant="sidenav">
              {t("routes.keys.new-group-api-key.card.form.title")}
            </Typography>
          </Stack>
          <FormControl fullWidth required>
            <InputLabel>
              {t("routes.keys.new-group-api-key.card.form.placeholder")}
            </InputLabel>
            <Select
              label={t("routes.keys.new-group-api-key.card.form.placeholder")}
            ></Select>
            <FormHelperText>
              {t("routes.keys.new-group-api-key.card.form.description")}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
      <Grid container marginTop={3} spacing={0}>
        <Grid item xs={6}>
          <ButtonCancel onClick={() => handleCancel()} />
        </Grid>
        <Grid item textAlign="right" xs={6}>
          <ButtonNext onClick={() => handleConfirm()} />
        </Grid>
      </Grid>
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

NewGroupApiKey.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
