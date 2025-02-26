import { AccessControl } from "@/components/access-control";
import { StateEnum } from "@/generated/api/Subscription";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SelfcareRoles } from "@/types/auth";
import { Delete, ExpandMore, Warning } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useTranslation } from "next-i18next";

import { ApiKeyTag } from "../api-key-tag";
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

  const isApiKeySuspended = () => apiKey.state === StateEnum.suspended;
  const canBeExpanded = () => apiKey.state === StateEnum.active;

  const handleExpandChange = (
    event: React.SyntheticEvent,
    expanded: boolean,
  ) => {
    event.stopPropagation();
    console.log("handleExpandChange");
    if (expanded) {
      if (canBeExpanded()) return onExpand(expanded, subscriptionId);
    } else return onExpand(expanded, subscriptionId);
  };

  if (isExpanded) onExpand(true, subscriptionId);

  return (
    <Accordion
      defaultExpanded={isExpanded}
      disableGutters
      disabled={apiKey.state === StateEnum.cancelled}
      key={subscriptionId}
      onChange={handleExpandChange}
      square
      sx={{
        border: borderStyle,
        borderRadius: 1,
        marginY: 1,
      }}
    >
      <AccordionSummary
        expandIcon={canBeExpanded() ? <ExpandMore /> : null}
        id="panel1-header"
      >
        <Stack direction="row" flex={1} justifyContent="space-between">
          <Stack direction="row" flex={1} spacing={1}>
            <Box>{apiKey.name}</Box>
            {isApiKeySuspended() && (
              <ApiKeyTag
                color="warning"
                icon={<Warning />}
                label="routes.keys.groups.state.suspended.label"
                tooltip="routes.keys.groups.state.suspended.tooltip"
              />
            )}
          </Stack>
          {apiKey.state !== StateEnum.cancelled && (
            <AccessControl requiredRole={SelfcareRoles.admin}>
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
          )}
        </Stack>
      </AccordionSummary>
      {canBeExpanded() ? (
        apiKey.primary_key && apiKey.cidrs ? (
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
        ) : (
          <Box paddingY={1} textAlign="center">
            <CircularProgress size={30} />
          </Box>
        )
      ) : null}
    </Accordion>
  );
};
