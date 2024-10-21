import { ButtonCancel, ButtonNext } from "@/components/buttons";
import { useDialog } from "@/components/dialog-provider";
import GenerateApiKeyForm from "@/components/groups-api-key/generate-api-key-form";
import { PageHeader } from "@/components/headers";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { Group } from "@/generated/api/Group";
import { GroupPagination } from "@/generated/api/GroupPagination";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect, useState } from "react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

const pageTitleLocaleKey = "routes.keys.new-group-api-key.title";
const pageDescriptionLocaleKey = "routes.keys.new-group-api-key.description";

export default function NewGroupApiKey() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();

  const showDialog = useDialog();
  const { data: groupsData, fetchData: groupsFetchData } =
    useFetch<GroupPagination>();

  const { fetchData: subscriptionFetchData } =
    useFetch<CreateManageGroupSubscription>();

  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string>("");

  const handleFormValidation = (
    isFormValid: boolean,
    formSelectedId: string,
  ) => {
    setFormStatus(isFormValid);
    setSelectedId(formSelectedId);
  };

  const institutionId = session?.user?.institution.id as string;
  const groupId = selectedId;

  const fetchGroups = () => {
    groupsFetchData("getInstitutionGroups", { institutionId }, GroupPagination);
  };

  useEffect(() => {
    fetchGroups();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const groupList = groupsData?.value;
    console.log(groupList);
  }, [groupsData]);

  const methods = useForm({
    defaultValues: {
      group: "",
    },
  });

  const placeholderGroups: Group[] = [
    {
      id: "value1",
      name: "label1",
    },
    {
      id: "value2",
      name: "label2",
    },
  ];

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

  const handleConfirm = async () => {
    await subscriptionFetchData(
      "upsertManageGroupSubscription",
      { body: { groupId } },
      CreateManageGroupSubscription,
      { notify: "all" },
    );
    router.back();
  };

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push("/keys")}
        showExit
        title={pageTitleLocaleKey}
        titleVariant="h2"
      />
      <Box bgcolor="background.paper" borderRadius="4px" padding="24px">
        <Typography marginBottom={2} variant="h6">
          {t("routes.keys.new-group-api-key.cardTitle")}
        </Typography>
        <Typography marginBottom={2} variant="body2">
          {t("routes.keys.new-group-api-key.cardDescription")}
        </Typography>
        <Typography
          color={"error"}
          fontWeight={600}
          marginBottom={2}
          variant="body2"
        >
          {t("routes.keys.new-group-api-key.cardHint")}
        </Typography>
        <Box>
          <Stack alignItems="center" direction="row" gap={1} marginBottom={2}>
            <SupervisedUserCircleIcon />
            <Typography variant="sidenav">
              {t("routes.keys.new-group-api-key.form.title")}
            </Typography>
          </Stack>
          <FormProvider {...methods}>
            <GenerateApiKeyForm
              groups={placeholderGroups}
              onFormValidation={handleFormValidation}
            />
          </FormProvider>
        </Box>
      </Box>
      <Grid container marginTop={3} spacing={0}>
        <Grid item xs={6}>
          <ButtonCancel onClick={() => handleCancel()} />
        </Grid>
        <Grid item textAlign="right" xs={6}>
          <ButtonNext disabled={formStatus} onClick={() => handleConfirm()} />
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
