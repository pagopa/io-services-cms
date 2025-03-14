import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
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
  /** Main component card title */
  title?: string;
  /** Used to log the page where the event is triggered */
  type: "manage" | "use";
}

/** API Key main component
 *
 * Used to show, copy, regenerate `keys` _(primary/secondary)_.
 * */
export const ApiKeys = (props: ApiKeysProps) => (
  <Box
    bgcolor="background.paper"
    borderRadius={0.5}
    id="card-details"
    padding={3}
  >
    <ApiKeysHeader description={props.description} title={props.title} />
    <ApiKeysCouple
      keys={props.keys}
      onRegenerateKey={props.onRegenerateKey}
      type={props.type}
    />
  </Box>
);
