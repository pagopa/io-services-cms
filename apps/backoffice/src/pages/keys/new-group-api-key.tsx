import { ApiKeyCreateUpdate } from "@/components/api-keys/api-key-create-update";
import { PageHeader } from "@/components/headers";
import { getConfiguration } from "@/config";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { Subscription } from "@/generated/api/Subscription";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ROUTES } from "@/lib/routes";
import { trackGroupKeyGenerateEndEvent } from "@/utils/mix-panel";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.new-group-api-key.title";
const pageDescriptionLocaleKey = "routes.new-group-api-key.description";
export default function NewGroupApiKey() {
  const router = useRouter();
  const { fetchData: upsertSubFetchData } = useFetch<Subscription>();

  const handleConfirm = async (group: CreateManageGroupSubscription) => {
    const result = await upsertSubFetchData(
      "upsertManageGroupSubscription",
      {
        body: group,
      },
      Subscription,
      { notify: "all" },
    );
    if (result.success) {
      trackGroupKeyGenerateEndEvent("success");
    } else {
      trackGroupKeyGenerateEndEvent("error");
    }
    // redirect to keys page
    router.push(ROUTES.KEYS.LIST);
  };

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push(ROUTES.KEYS.LIST)}
        showExit
        title={pageTitleLocaleKey}
      />
      <ApiKeyCreateUpdate onConfirm={handleConfirm} />
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  if (!getConfiguration().GROUP_APIKEY_ENABLED) {
    return { notFound: true };
  }
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

NewGroupApiKey.requiredPermissions = ["ApiServiceWrite"];
