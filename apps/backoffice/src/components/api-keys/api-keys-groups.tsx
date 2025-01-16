/* eslint-disable max-lines-per-function */
import { Cidr } from "@/generated/api/Cidr";
import { Group } from "@/generated/api/Group";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { Subscription } from "@/generated/api/Subscription";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import useFetch, { client } from "@/hooks/use-fetch";
import { Add, Delete, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
} from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { AccessControl } from "../access-control";
import { useDialog } from "../dialog-provider";
import { ApiKeys } from "./api-keys";
import { ApiKeysHeader } from "./api-keys-header";
import { AuthorizedCidrs } from "./authorized-cidrs";

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

/** Single Group API Key interface */
interface ApiKeyGroupProps {
  apiKey: RecordApiKeyValue;
  onDelete: (event: React.MouseEvent, subscriptionId: string) => void;
  onExpand: (expanded: boolean, subscriptionId: string) => void;
  onRotateKey: (
    keyType: SubscriptionKeyTypeEnum,
    subscriptionId: string,
  ) => void;
  onUpdateCidrs: (cidrs: string[], subscriptionId: string) => void;
  subscriptionId: string;
}

type ApiKeysGroupRecordset = Record<string, RecordApiKeyValue>;

interface RecordApiKeyValue {
  cidrs: string[];
  name: string;
  primary_key: string;
  secondary_key: string;
}

const convertArrayToRecordset = (
  items: Subscription[],
): ApiKeysGroupRecordset =>
  items.reduce((acc, item) => {
    acc[item.id] = {
      cidrs: [],
      name: item.name,
      primary_key: "",
      secondary_key: "",
    };
    return acc;
  }, {} as ApiKeysGroupRecordset);

const checkGroupsExists = async (institutionId: string) => {
  try {
    const maybeResponse = await client.checkInstitutionGroupsExistence({
      institutionId,
    });

    if (E.isRight(maybeResponse)) {
      return maybeResponse.right.status === 200;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const borderStyle = "1px solid #E3E7EB";

/** Group API Keys main component
 *
 * Used to show, copy, rotate `keys` _(primary/secondary)_ and edit optional `authorized cidrs`.
 * */
export const ApiKeysGroups = (props: ApiKeysGroupsProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();

  const { data: mspData, fetchData: mspFetchData } =
    useFetch<SubscriptionPagination>();
  const { data: keysData, fetchData: skFetchData } =
    useFetch<SubscriptionKeys>();
  const { data: cidrsData, fetchData: scFetchData } =
    useFetch<ManageKeyCIDRs>();

  const [apiKeys, setApiKeys] = useState<ApiKeysGroupRecordset | undefined>(
    undefined,
  );

  const handleOnGenerateClick = async () => {
    const hasAtLeastOneGroup = await checkGroupsExists(
      session?.user?.institution.id as string,
    );

    if (hasAtLeastOneGroup) {
      props.onGenerateClick();
    } else {
      const noGroupAvailableCreateOne = await showDialog({
        cancelButtonLabel: t("buttons.close"),
        confirmButtonLabel: t("routes.keys.groups.noGroupModal.confirm"),
        message: t("routes.keys.groups.noGroupModal.description"),
        title: t("routes.keys.groups.title"),
      });
      if (noGroupAvailableCreateOne) {
        props.onCreateGroupClick();
      }
    }
  };

  const updateApiKey = (key: string, newValues: Partial<RecordApiKeyValue>) => {
    setApiKeys((prevApiKeys) => {
      const currentRecord = prevApiKeys?.[key] || {
        cidrs: [],
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
    if (expanded && apiKeys && !apiKeys[subscriptionId].primary_key) {
      const apiKeyObjValue: RecordApiKeyValue = {
        cidrs: [],
        name: apiKeys[subscriptionId].name,
        primary_key: "",
        secondary_key: "",
      };
      const maybeKeysResponse = await client.getManageSubscriptionKeys({
        subscriptionId,
      });
      if (E.isRight(maybeKeysResponse)) {
        const maybeKeys = SubscriptionKeys.decode(
          maybeKeysResponse.right.value,
        );
        if (E.isRight(maybeKeys)) {
          apiKeyObjValue.primary_key = maybeKeys.right.primary_key;
          apiKeyObjValue.secondary_key = maybeKeys.right.secondary_key;
        }
      }

      const maybeCidrsResponse =
        await client.getManageSubscriptionAuthorizedCidrs({
          subscriptionId,
        });
      if (E.isRight(maybeCidrsResponse)) {
        const maybeCidrs = ManageKeyCIDRs.decode(
          maybeCidrsResponse.right.value,
        );
        if (E.isRight(maybeCidrs)) {
          apiKeyObjValue.cidrs = [...maybeCidrs.right.cidrs];
        }
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
      <AccessControl requiredRole="admin">
        <Button
          onClick={handleOnGenerateClick}
          size="medium"
          startIcon={<Add />}
          sx={{ marginBottom: 2 }}
          variant="contained"
        >
          {t("routes.keys.groups.generate")}
        </Button>
      </AccessControl>
      <Box>
        {Object.entries(apiKeys ?? {}).map(([id, apiKey]) => (
          <ApiKeysGroups.ApiKeyGroup
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

/** ApiKeyGroup internal component */
const ApiKeyGroup = ({
  apiKey,
  onDelete,
  onExpand,
  onRotateKey,
  onUpdateCidrs,
  subscriptionId,
}: ApiKeyGroupProps) => {
  const { t } = useTranslation();

  return (
    <Accordion
      disableGutters
      key={subscriptionId}
      onChange={(_, expanded) => onExpand(expanded, subscriptionId)}
      square
      sx={{
        border: borderStyle,
        borderRadius: 1,
        marginY: 1,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore />} id="panel1-header">
        <Stack direction="row" flex={1} justifyContent="space-between">
          <Box fontWeight={600}>{apiKey.name}</Box>
          <Box marginRight={1}>
            <Button
              color="error"
              onClick={(event) => onDelete(event, subscriptionId)}
              startIcon={<Delete />}
              variant="naked"
            >
              {t("buttons.delete")}
            </Button>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          border: borderStyle,
          borderRadius: 1,
          margin: 3,
          marginTop: 1,
        }}
      >
        <ApiKeys
          keys={{
            primary_key: apiKey.primary_key,
            secondary_key: apiKey.secondary_key,
          }}
          onRotateKey={(type) => onRotateKey(type, subscriptionId)}
          type="manage" // TODO: must add new type for "manage_group"
        />
        <AuthorizedCidrs
          cidrs={apiKey.cidrs as unknown as string[]}
          description="routes.keys.authorizedCidrs.description"
          editable={true}
          onSaveClick={(cidrs) => onUpdateCidrs(cidrs, subscriptionId)}
        />
      </AccordionDetails>
    </Accordion>
  );
};

// namespaced component
ApiKeysGroups.ApiKeyGroup = ApiKeyGroup;
