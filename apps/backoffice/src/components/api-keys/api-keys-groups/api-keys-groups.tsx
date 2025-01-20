import { Cidr } from "@/generated/api/Cidr";
import { Group } from "@/generated/api/Group";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { Subscription } from "@/generated/api/Subscription";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import useFetch from "@/hooks/use-fetch";
import { getBffApiClient } from "@/utils/bff-api-client";
import { isNullUndefinedOrEmpty } from "@/utils/string-util";
import { Box } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { useTranslation } from "next-i18next";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

import { buildSnackbarItem } from "../../notification";
import { ApiKeysHeader } from "../api-keys-header";
import { ApiKeyGroup } from "./api-keys-group";
import { ButtonGenerateApiKeysGroup } from "./button-generate-api-keys-group";

export interface ApiKeysGroupsProps {
  /** Main component card description */
  description?: string;
  /** Selfcare groups */
  groups?: Group[];
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
    };
    return acc;
  }, {} as ApiKeysGroupRecordset);

/** Group API Keys main component
 *
 * Used to show, copy, rotate `keys` _(primary/secondary)_ and edit optional `authorized cidrs`.
 * */
export const ApiKeysGroups = (props: ApiKeysGroupsProps) => {
  const { t } = useTranslation();

  const { data: mspData, fetchData: mspFetchData } =
    useFetch<SubscriptionPagination>();
  const { data: keysData, fetchData: skFetchData } =
    useFetch<SubscriptionKeys>();
  const { data: cidrsData, fetchData: scFetchData } =
    useFetch<ManageKeyCIDRs>();

  const [apiKeys, setApiKeys] = useState<ApiKeysGroupRecordset | undefined>(
    undefined,
  );

  const updateApiKey = (key: string, newValues: Partial<RecordApiKeyValue>) => {
    setApiKeys((prevApiKeys) => {
      const currentRecord = prevApiKeys?.[key] || {
        name: "",
        primary_key: "",
        secondary_key: "",
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

  const handleRotateKey = (
    keyType: SubscriptionKeyTypeEnum,
    subscriptionId: string,
  ) => {
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

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("TODO: delete");
  };

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
      setApiKeys(convertArrayToRecordset(mspData.value as Subscription[]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mspData?.value]);

  // Fetch all Manage Group API Keys
  useEffect(() => {
    mspFetchData(
      "getManageSubscriptions",
      { kind: SubscriptionTypeEnum.MANAGE_GROUP, limit: 10 },
      SubscriptionPagination,
      {
        notify: "errors",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      bgcolor="background.paper"
      borderRadius={0.5}
      id="card-details"
      padding={3}
    >
      <ApiKeysHeader description={props.description} title={props.title} />
      <ButtonGenerateApiKeysGroup
        onCreateGroupClick={props.onCreateGroupClick}
        onGenerateClick={props.onGenerateClick}
      />
      <Box>
        {Object.entries(apiKeys ?? {}).map(([id, apiKey]) => (
          <ApiKeyGroup
            apiKey={apiKey}
            key={id}
            onDelete={handleDeleteClick}
            onExpand={handleOnExpandClick}
            onRotateKey={handleRotateKey}
            onUpdateCidrs={handleUpdateCidrs}
            subscriptionId={id}
          />
        ))}
      </Box>
    </Box>
  );
};
