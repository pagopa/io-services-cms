import { AccessControl } from "@/components/access-control";
import { CardBaseContainer, CardRowType, CardRows } from "@/components/cards";
import { LoaderSkeleton } from "@/components/loaders";
import { getConfiguration } from "@/config";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import useFetch from "@/hooks/use-fetch";
import {
  hasApiKeyGroupsFeatures,
  hasManageKeyGroup,
  hasManageKeyRoot,
  isAtLeastInOneGroup,
  isOperator,
} from "@/utils/auth-util";
import { ArrowForward } from "@mui/icons-material";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";

import { ApiKeyTag } from "../api-key-tag";
import { ApiKeysGroupsEmptyState } from "../api-keys-groups";
import { ApiKeysGroupTag } from "../api-keys-groups/api-keys-group-tag";

const { GROUP_APIKEY_ENABLED } = getConfiguration();
const KEYS_ROUTE_PATH = "/keys";
const MAX_APIKEY_GROUP_TO_DISPLAY = 5;

export const ApiKeysCard = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();

  const { data: mkData, fetchData: mkFetchData } = useFetch<SubscriptionKeys>();
  const {
    data: mspData,
    fetchData: mspFetchData,
    loading: mspLoading,
  } = useFetch<SubscriptionPagination>();

  const showManageKeyRoot = hasManageKeyRoot(GROUP_APIKEY_ENABLED)(session);
  const showManageKeyGroup = hasManageKeyGroup(GROUP_APIKEY_ENABLED)(session);
  const hideKeysCta =
    hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
    isOperator(session) &&
    isAtLeastInOneGroup(session) &&
    mspData?.value &&
    mspData.value.length === 0;

  const manageKeyRows: CardRowType[] = [
    {
      kind: "apikey",
      label: "keys.primary.title",
      value: mkData?.primary_key,
    },
    {
      kind: "apikey",
      label: "keys.secondary.title",
      value: mkData?.secondary_key,
    },
  ];

  useEffect(() => {
    if (showManageKeyRoot) {
      mkFetchData("getManageKeys", {}, SubscriptionKeys);
    }
    if (showManageKeyGroup) {
      mspFetchData(
        "getManageSubscriptions",
        {
          kind: SubscriptionTypeEnum.MANAGE_GROUP,
          limit: MAX_APIKEY_GROUP_TO_DISPLAY + 1,
        },
        SubscriptionPagination,
        {
          notify: "errors",
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AccessControl requiredPermissions={["ApiServiceWrite"]}>
      <CardBaseContainer>
        <Stack divider={<Divider flexItem />} spacing={3}>
          {showManageKeyRoot && (
            <>
              <Typography id="card-title" variant="overline">
                {t("routes.keys.manage.master.title")}
              </Typography>
              <Box id="body-rows" marginTop={4}>
                <CardRows rows={manageKeyRows} />
              </Box>
            </>
          )}
          {showManageKeyGroup && (
            <>
              <Typography id="card-title" variant="overline">
                {t("routes.keys.manage.group.title")}
              </Typography>
              <ApiKeysGroupsEmptyState
                apiKeysGroups={mspData?.value}
                loading={mspLoading}
              />
              <LoaderSkeleton loading={mspLoading} style={{ height: 40 }}>
                {mspData?.value && mspData.value.length > 0 && (
                  <Box paddingTop={2}>
                    {mspData?.value
                      .slice(0, MAX_APIKEY_GROUP_TO_DISPLAY)
                      .map((apiKeyGroup) => (
                        <ApiKeysGroupTag
                          key={apiKeyGroup.id}
                          onClick={() =>
                            router.push(
                              `${KEYS_ROUTE_PATH}?id=${apiKeyGroup.id}`,
                            )
                          }
                          value={apiKeyGroup}
                        />
                      ))}
                    {mspData?.value &&
                      mspData.value.length > MAX_APIKEY_GROUP_TO_DISPLAY && (
                        <ApiKeyTag
                          label={t("routes.overview.apiKeys.showMore")}
                          onClick={() => router.push(KEYS_ROUTE_PATH)}
                        />
                      )}
                  </Box>
                )}
              </LoaderSkeleton>
            </>
          )}
        </Stack>
        {!hideKeysCta && (
          <Box id="card-cta" marginTop={3}>
            <NextLink href={KEYS_ROUTE_PATH}>
              <ButtonNaked
                color="primary"
                endIcon={<ArrowForward />}
                size="medium"
                sx={{ fontWeight: 700 }}
              >
                {t("routes.keys.manage.master.shortcut")}
              </ButtonNaked>
            </NextLink>
          </Box>
        )}
      </CardBaseContainer>
    </AccessControl>
  );
};
