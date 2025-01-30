import { AccessControl } from "@/components/access-control";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { Delete, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
} from "@mui/material";
import { useTranslation } from "next-i18next";

import { ApiKeys } from "../api-keys";
import { AuthorizedCidrs } from "../authorized-cidrs";
import { RecordApiKeyValue } from "./api-keys-groups";

/** Single Group API Key interface */
interface ApiKeyGroupProps {
  apiKey: RecordApiKeyValue;
  /** If true, render accordion opened */
  isExpanded?: boolean;
  onDelete: (subscription: { id: string; name: string }) => void;
  onExpand: (expanded: boolean, subscriptionId: string) => void;
  onRotateKey: (
    keyType: SubscriptionKeyTypeEnum,
    subscriptionId: string,
  ) => void;
  onUpdateCidrs: (cidrs: string[], subscriptionId: string) => void;
  subscriptionId: string;
}

const borderStyle = "1px solid #E3E7EB";

/** ApiKeyGroup component */
export const ApiKeyGroup = ({
  apiKey,
  isExpanded,
  onDelete,
  onExpand,
  onRotateKey,
  onUpdateCidrs,
  subscriptionId,
}: ApiKeyGroupProps) => {
  const { t } = useTranslation();

  if (isExpanded) onExpand(true, subscriptionId);

  return (
    <Accordion
      defaultExpanded={isExpanded}
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
          <AccessControl requiredRole="admin">
            <Box marginRight={1}>
              <Button
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete({ id: subscriptionId, name: apiKey.name });
                }}
                startIcon={<Delete />}
                variant="naked"
              >
                {t("buttons.delete")}
              </Button>
            </Box>
          </AccessControl>
        </Stack>
      </AccordionSummary>
      {apiKey.primary_key && apiKey.cidrs && (
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
      )}
    </Accordion>
  );
};
