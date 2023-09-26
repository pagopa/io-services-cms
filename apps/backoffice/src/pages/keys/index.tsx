import { ApiKeys } from "@/components/api-keys";
import { PageHeader } from "@/components/headers";
import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.keys.title";
const pageDescriptionLocaleKey = "routes.keys.description";

export default function Keys() {
  const { t } = useTranslation();

  const { data: manageKey, fetchData: fetchManageKey } = useFetch<
    SubscriptionKeys
  >();

  const { data: authCidrs, fetchData: fetchAuthCidrs } = useFetch<
    ManageKeyCIDRs
  >();

  const handleRotateKey = (keyType: SubscriptionKeyTypeEnum) => {
    fetchManageKey("regenerateManageKey", { keyType }, SubscriptionKeys);
  };

  const handleUpdateCidrs = (cidrs: string[]) => {
    fetchAuthCidrs(
      "updateManageKeysAuthorizedCidrs",
      { body: { cidrs: Array.from(cidrs || []).filter(Cidr.is) } },
      ManageKeyCIDRs
    );
  };

  useEffect(() => {
    fetchManageKey("getManageKeys", {}, SubscriptionKeys);
    fetchAuthCidrs("getManageKeysAuthorizedCidrs", {}, ManageKeyCIDRs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <ApiKeys
        title={t("routes.keys.manage.title")}
        description={t("routes.keys.manage.description")}
        keys={manageKey}
        onRotateKey={handleRotateKey}
        showAuthorizedCidrs
        cidrs={authCidrs ? ((authCidrs.cidrs as unknown) as string[]) : []}
        onUpdateCidrs={handleUpdateCidrs}
      />
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}

Keys.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
