import { ApiKeys, AuthorizedCidrs } from "@/components/api-keys";
import { ApiKeysGroups } from "@/components/api-keys/api-keys-groups";
import { PageHeader } from "@/components/headers";
import { getConfiguration } from "@/config";
import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import {
  hasManageKeyGroup,
  hasManageKeyRoot,
  isAdmin,
} from "@/utils/auth-util";
import { trackApiKeyPageEvent } from "@/utils/mix-panel";
import { Stack } from "@mui/material";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.keys.title";
const pageDescriptionLocaleKey = "routes.keys.description";

const { GROUP_APIKEY_ENABLED } = getConfiguration();

export default function Keys() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: mkData, fetchData: mkFetchData } = useFetch<SubscriptionKeys>();
  const { data: acData, fetchData: acFetchData } = useFetch<ManageKeyCIDRs>();

  const showManageKeyRoot = hasManageKeyRoot(GROUP_APIKEY_ENABLED)(session);
  const showManageKeyGroup = hasManageKeyGroup(GROUP_APIKEY_ENABLED)(session);

  const handleRegenerateKey = (keyType: SubscriptionKeyTypeEnum) => {
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
    if (showManageKeyRoot) {
      mkFetchData("getManageKeys", {}, SubscriptionKeys, { notify: "errors" });
      acFetchData("getManageKeysAuthorizedCidrs", {}, ManageKeyCIDRs, {
        notify: "errors",
      });
    }
    trackApiKeyPageEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      {showManageKeyRoot && (
        <Stack>
          <ApiKeys
            description={t("routes.keys.manage.master.description")}
            keys={mkData}
            onRegenerateKey={handleRegenerateKey}
            title={t("routes.keys.manage.master.title")}
            type="manage"
          />
          <AuthorizedCidrs
            cidrs={acData?.cidrs as unknown as string[]}
            description="routes.keys.authorizedCidrs.description"
            editable={!(GROUP_APIKEY_ENABLED && !isAdmin(session))}
            onSaveClick={handleUpdateCidrs}
          />
        </Stack>
      )}
      {showManageKeyGroup && (
        <Stack marginTop={3}>
          <ApiKeysGroups
            description={t("routes.keys.manage.group.description")}
            onCreateGroupClick={() =>
              window.open(
                `${getConfiguration().SELFCARE_URL}/dashboard/${
                  session?.user?.institution.id
                }/groups/add`,
                "_blank",
              )
            }
            onGenerateClick={() => router.push("/keys/new-group-api-key")}
            title={t("routes.keys.manage.group.title")}
          />
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
