import { ApiKeys, AuthorizedCidrs } from "@/components/api-keys";
import { PageHeader } from "@/components/headers";
import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import logToMixpanel from "@/utils/mix-panel";
import { Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.keys.title";
const pageDescriptionLocaleKey = "routes.keys.description";

export default function Keys() {
  const { t } = useTranslation();
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
    logToMixpanel("IO_BO_APIKEY_PAGE", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ApiKeys
            description={t("routes.keys.manage.description")}
            keys={mkData}
            onRotateKey={handleRotateKey}
            page="manage"
            title={t("routes.keys.manage.title")}
          />
        </Grid>
        <Grid item xs={12}>
          <AuthorizedCidrs
            cidrs={acData?.cidrs as unknown as string[]}
            description="routes.keys.authorizedCidrs.description"
            editable={true}
            onSaveClick={handleUpdateCidrs}
          />
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

Keys.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};

Keys.requiredPermissions = ["ApiServiceWrite"];
