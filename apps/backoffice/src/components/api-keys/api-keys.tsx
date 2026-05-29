import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { ApiKeyScopeType } from "@/types/api-key";
import { Box } from "@mui/material";

import { ApiKeysCouple } from "./api-keys-couple";
import { ApiKeysHeader } from "./api-keys-header";

export interface ApiKeysProps {
  /** Main component card description */
  description?: string;
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Regenerate" on confirmation modal */
  onRegenerateKey: (type: SubscriptionKeyTypeEnum) => void;
  /** Used to define scope: **manage** _(root or group)_ or **use** */
  scope: ApiKeyScopeType;
  /** Main component card title */
  title?: string;
}

/** API Key main component
 *
 * Used to show, copy, regenerate `keys` _(primary/secondary)_.
 * */
export const ApiKeys = ({
  description,
  keys,
  onRegenerateKey,
  scope,
  title,
}: ApiKeysProps) => (
  <Box
    bgcolor="background.paper"
    borderRadius={0.5}
    id="card-details"
    padding={3}
  >
    <ApiKeysHeader description={description} title={title} />
    <ApiKeysCouple
      keys={keys}
      onRegenerateKey={onRegenerateKey}
      scope={scope}
    />
  </Box>
);
