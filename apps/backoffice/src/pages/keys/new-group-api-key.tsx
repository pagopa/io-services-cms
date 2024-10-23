import { GroupApiKeyCreate } from "@/components/groups-api-key/group-api-key-create";
import { PageHeader } from "@/components/headers";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { Group } from "@/generated/api/Group";
import { GroupPagination } from "@/generated/api/GroupPagination";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect, useState } from "react";
import React from "react";

const pageTitleLocaleKey = "routes.keys.new-group-api-key.title";
const pageDescriptionLocaleKey = "routes.keys.new-group-api-key.description";

export default function NewGroupApiKey() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: groupsData, fetchData: groupsFetchData } =
    useFetch<GroupPagination>();

  const { fetchData: subscriptionFetchData } =
    useFetch<CreateManageGroupSubscription>();

  // const [formStatus, setFormStatus] = useState<boolean>(true);
  // const [selectedId, setSelectedId] = useState<string>("");
  const [groupsList, setGroupsList] = useState<Group[]>([]);

  // const handleFormValidation = (
  //   isFormValid: boolean,
  //   formSelectedId: string,
  // ) => {
  //   setFormStatus(isFormValid);
  //   setSelectedId(formSelectedId);
  // };

  const institutionId = session?.user?.institution.id as string;
  // const groupId = selectedId;

  const fetchGroups = () => {
    groupsFetchData("getInstitutionGroups", { institutionId }, GroupPagination);
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (groupsData) {
      setGroupsList([...groupsData.value]);
    }
  }, [groupsData]);

  // const methods = useForm({
  //   defaultValues: {
  //     group: "",
  //   },
  // });

  // const handleCancel = async () => {
  //   const confirmed = await showDialog({
  //     message: t("forms.cancel.description"),
  //     title: t("forms.cancel.title"),
  //   });
  //   if (confirmed) {
  //     console.log("operation cancelled");
  //     router.back();
  //   } else {
  //     console.log("modal cancelled");
  //   }
  // };

  const handleConfirm = async (groupId: string) => {
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
      <GroupApiKeyCreate groups={groupsList} onConfirm={handleConfirm} />
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
