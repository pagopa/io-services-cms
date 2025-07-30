/* eslint-disable max-lines-per-function */
import { useDialog } from "@/components/dialog-provider";
import { LoaderSkeleton } from "@/components/loaders";
import { Cidr } from "@/generated/api/Cidr";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { StateEnum, Subscription } from "@/generated/api/Subscription";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import useFetch from "@/hooks/use-fetch";
import { getBffApiClient } from "@/utils/bff-api-client";
import {
  trackGroupKeyDeleteEvent,
  trackGroupKeyRegenerateEvent,
} from "@/utils/mix-panel";
import { isNullUndefinedOrEmpty } from "@/utils/string-util";
import { KeyboardArrowDown } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import * as E from "fp-ts/lib/Either";
import * as tt from "io-ts";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";

import { buildSnackbarItem } from "../../notification";
import { ApiKeysHeader } from "../api-keys-header";
import { ApiKeyGroup } from "./api-keys-group";
import { ApiKeysGroupsEmptyState } from "./api-keys-groups-empty-state";
import { ButtonGenerateApiKeysGroup } from "./button-generate-api-keys-group";

const GET_MANAGE_GROUP_SUBSCRIPTIONS_LIMIT = 10;

export interface ApiKeysGroupsProps {
  /** Main component card description */
  description?: string;
  /** Event triggered when user click "Create group" on modal that warns of the non-existence of any SC group */
  onCreateGroupClick: () => void;
  /** Event triggered when user click "Generate API Key" */
  onGenerateClick: () => void;
  /** Main component card title */
  title: string;
}

export interface RecordApiKeyValue {
  cidrs?: string[];
  name: string;
  primary_key: string;
  secondary_key: string;
  state?: StateEnum;
}

type ApiKeysGroupRecordset = Record<string, RecordApiKeyValue>;

const convertArrayToRecordset = (
  items: Subscription[],
): ApiKeysGroupRecordset =>
  items.reduce((acc, item) => {
    acc[item.id] = {
      name: item.name,
      primary_key: "",
      secondary_key: "",
      state: item.state,
    };
    return acc;
  }, {} as ApiKeysGroupRecordset);

/** Group API Keys main component
 *
 * Used to show, copy, regenerate `keys` _(primary/secondary)_ and edit optional `authorized cidrs`.
 * */
export const ApiKeysGroups = (props: ApiKeysGroupsProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const showDialog = useDialog();

  const { id: queryId } = router.query; // Query parameter `id`
  const accordionRefs = useRef<Record<string, HTMLDivElement | null>>({}); // Accordions reference map

  const {
    data: mspData,
    fetchData: mspFetchData,
    loading: mspLoading,
  } = useFetch<SubscriptionPagination>();
  const { data: keysData, fetchData: skFetchData } =
    useFetch<SubscriptionKeys>();
  const { data: cidrsData, fetchData: scFetchData } =
    useFetch<ManageKeyCIDRs>();
  const { fetchData: noContentFetchData } = useFetch<unknown>();

  const [apiKeys, setApiKeys] = useState<ApiKeysGroupRecordset | undefined>(
    undefined,
  );
  const [pagination, setPagination] = useState({
    count: 0,
    limit: GET_MANAGE_GROUP_SUBSCRIPTIONS_LIMIT,
    offset: 0,
  });

  const getManageGroupSubscriptions = () =>
    mspFetchData(
      "getManageSubscriptions",
      {
        kind: SubscriptionTypeEnum.MANAGE_GROUP,
        limit: pagination.limit,
        offset: pagination.offset,
      },
      SubscriptionPagination,
      {
        notify: "errors",
      },
    );

  const handleLoadMore = () =>
    setPagination({
      ...pagination,
      offset: pagination.offset + pagination.limit,
    });

  const updateApiKey = (key: string, newValues: Partial<RecordApiKeyValue>) => {
    setApiKeys((prevApiKeys) => {
      const currentRecord = prevApiKeys?.[key] || {
        name: "",
        primary_key: "",
        secondary_key: "",
        state: undefined,
      };

      return {
        ...prevApiKeys,
        [key]: {
          ...currentRecord,
          ...newValues,
        },
      };
    });
  };

  const handleOnExpandClick = async (
    expanded: boolean,
    subscriptionId: string,
  ) => {
    // UC: open collapse (expanded) for the first time, try to fetch until keys or cidrs are valorized
    if (
      expanded &&
      apiKeys &&
      (isNullUndefinedOrEmpty(apiKeys[subscriptionId].primary_key) ||
        apiKeys[subscriptionId].cidrs === undefined)
    ) {
      const apiKeyObjValue: RecordApiKeyValue = {
        name: apiKeys[subscriptionId].name,
        primary_key: "",
        secondary_key: "",
        state: apiKeys[subscriptionId].state,
      };

      const maybeKeys = await getBffApiClient().fetchData(
        "getManageSubscriptionKeys",
        { subscriptionId },
        SubscriptionKeys,
      );
      if (E.isRight(maybeKeys)) {
        apiKeyObjValue.primary_key = maybeKeys.right.primary_key;
        apiKeyObjValue.secondary_key = maybeKeys.right.secondary_key;
      }

      const maybeCidrs = await getBffApiClient().fetchData(
        "getManageSubscriptionAuthorizedCidrs",
        { subscriptionId },
        ManageKeyCIDRs,
      );

      if (E.isRight(maybeCidrs)) {
        apiKeyObjValue.cidrs = [...maybeCidrs.right.cidrs];
      }

      if (E.isLeft(maybeKeys) || E.isLeft(maybeCidrs)) {
        enqueueSnackbar(
          buildSnackbarItem({
            severity: "error",
            title: t("routes.keys.notifications.loadingError"),
          }),
        );
      }
      updateApiKey(subscriptionId, apiKeyObjValue);
    }
  };

  const handleRegenerateKey = (
    keyType: SubscriptionKeyTypeEnum,
    subscriptionId: string,
  ) => {
    trackGroupKeyRegenerateEvent(keyType);
    skFetchData(
      "regenerateManageSubscriptionKey",
      { keyType, subscriptionId },
      SubscriptionKeys,
      {
        notify: "all",
        referenceId: subscriptionId,
      },
    );
  };

  const handleUpdateCidrs = (cidrs: string[], subscriptionId: string) => {
    scFetchData(
      "updateManageSubscriptionAuthorizedCidrs",
      {
        body: { cidrs: Array.from(cidrs || []).filter(Cidr.is) },
        subscriptionId,
      },
      ManageKeyCIDRs,
      { notify: "all", referenceId: subscriptionId },
    );
  };

  const handleDeleteClick = async (subscription: {
    id: string;
    name: string;
  }) => {
    const confirmApiKeyDeletion = await showDialog({
      confirmButtonLabel: t("buttons.delete"),
      message: t("routes.services.deleteApiKeyGroupModal.description", {
        groupName: subscription.name,
      }),
      title: t("routes.services.deleteApiKeyGroupModal.title"),
    });
    if (confirmApiKeyDeletion) {
      trackGroupKeyDeleteEvent(subscription.id);
      await noContentFetchData(
        "deleteManageSubscription",
        { subscriptionId: subscription.id },
        tt.unknown,
        {
          notify: "all",
        },
      );
      // Reset api keys data and restart fetch from offset 0
      setApiKeys({});
      setPagination({ ...pagination, offset: 0 });
    }
  };

  const handleRef = (accordionId: string) => (el: HTMLDivElement | null) => {
    accordionRefs.current[accordionId] = el;
  };

  useEffect(() => {
    if (queryId) {
      // Delay scrolling to ensure rendering is complete
      setTimeout(() => {
        const targetEl = accordionRefs.current[queryId as string];
        if (targetEl) {
          targetEl.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 500);
    }
  }, [queryId]); // Expose the effect only when `queryId` changes.

  // update GroupApiKey keys
  useEffect(() => {
    if (keysData && keysData._referenceId && apiKeys) {
      const actualApiKey = apiKeys[keysData._referenceId];

      actualApiKey.primary_key = keysData.primary_key;
      actualApiKey.secondary_key = keysData.secondary_key;

      updateApiKey(keysData._referenceId, actualApiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysData]);

  // update GroupApiKey cidrs
  useEffect(() => {
    if (cidrsData && cidrsData._referenceId && apiKeys) {
      const actualApiKey = apiKeys[cidrsData._referenceId];

      actualApiKey.cidrs = [...cidrsData.cidrs];

      updateApiKey(cidrsData._referenceId, actualApiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cidrsData]);

  useEffect(() => {
    if (mspData?.value) {
      setApiKeys({
        ...apiKeys,
        ...convertArrayToRecordset(mspData.value as Subscription[]),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mspData?.value]);

  // Fetch all Manage Group API Keys
  useEffect(() => {
    getManageGroupSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination]);

  return (
    <Box
      bgcolor="background.paper"
      borderRadius={0.5}
      id="card-details"
      padding={3}
    >
      <ApiKeysHeader description={props.description} title={props.title} />
      <ApiKeysGroupsEmptyState
        apiKeysGroups={mspData?.value}
        hideAdminWarning
        loading={mspLoading}
      />
      <ButtonGenerateApiKeysGroup
        onCreateGroupClick={props.onCreateGroupClick}
        onGenerateClick={props.onGenerateClick}
      />
      <Box>
        {Object.entries(apiKeys ?? {}).map(([id, apiKey]) => (
          <Box key={id} ref={handleRef(id)}>
            <ApiKeyGroup
              apiKey={apiKey}
              isExpanded={id === queryId}
              key={id}
              onDelete={handleDeleteClick}
              onExpand={handleOnExpandClick}
              onRegenerateKey={handleRegenerateKey}
              onUpdateCidrs={handleUpdateCidrs}
              subscriptionId={id}
            />
          </Box>
        ))}
        <LoaderSkeleton
          loading={mspLoading}
          style={{ height: 85, width: "100%" }}
        >
          <></>
        </LoaderSkeleton>
        {mspData?.value.length === pagination.limit && (
          <Box textAlign="center">
            <ButtonNaked
              color="primary"
              endIcon={<KeyboardArrowDown fontSize="small" />}
              onClick={handleLoadMore}
              size="medium"
              sx={{ fontWeight: 700, marginTop: 1 }}
            >
              {t("routes.keys.manage.group.loadMore")}
            </ButtonNaked>
          </Box>
        )}
      </Box>
    </Box>
  );
};
