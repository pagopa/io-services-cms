import { ApiKeys, AuthorizedCidrs, GroupsApiKeys } from "@/components/api-keys";
import { PageHeader } from "@/components/headers";
import { getConfiguration } from "@/config";
import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Stack } from "@mui/material";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.keys.title";
const pageDescriptionLocaleKey = "routes.keys.description";

export default function Keys() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: mkData, fetchData: mkFetchData } = useFetch<SubscriptionKeys>();
  const { data: acData, fetchData: acFetchData } = useFetch<ManageKeyCIDRs>();

  const handleRotateKey = (keyType: SubscriptionKeyTypeEnum) => {
    mkFetchData("regenerateManageKey", { keyType }, SubscriptionKeys, {
      notify: "all",
    });
  };

  const handleUpdateCidrs = (cidrs: string[]) => {
    acFetchData(
      "updateManageKeysAuthorizedCidrs",
      { body: { cidrs: Array.from(cidrs || []).filter(Cidr.is) } },
      ManageKeyCIDRs,
      { notify: "all" },
    );
  };

  useEffect(() => {
    mkFetchData("getManageKeys", {}, SubscriptionKeys, { notify: "errors" });
    acFetchData("getManageKeysAuthorizedCidrs", {}, ManageKeyCIDRs, {
      notify: "errors",
    });
    trackApiKeyPageEvent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      <Stack>
        <ApiKeys
          description={t("routes.keys.manage.description")}
          keys={mkData}
          onRotateKey={handleRotateKey}
          title={t("routes.keys.manage.title")}
        />
        <AuthorizedCidrs
          cidrs={acData?.cidrs as unknown as string[]}
          description="routes.keys.authorizedCidrs.description"
          editable={true}
          onSaveClick={handleUpdateCidrs}
        />
      </Stack>
      {getConfiguration().GROUP_APIKEY_ENABLED && (
        <Stack marginTop={3}>
          <GroupsApiKeys
            description={t("routes.keys.groups.description")}
            onCreateGroupClick={() =>
              window.open(
                `${getConfiguration().SELFCARE_URL}/dashboard/${
                  session?.user?.institution.id
                }/groups/add`,
                "_blank",
              )
            }
            onGenerateClick={() => router.push("/keys/new-group-api-key")}
            title={t("routes.keys.groups.title")}
        </Stack>
      )}
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

Keys.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};

Keys.requiredPermissions = ["ApiServiceWrite"];
