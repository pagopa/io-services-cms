import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import {
  trackManageKeyCopyEvent,
  trackManageKeyRotateEvent,
  trackServiceKeyCopyEvent,
  trackServiceKeyRotateEvent,
} from "@/utils/mix-panel";
import { Box, Divider, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

import { useDialog } from "../dialog-provider";
import { ApiSingleKey } from "./api-single-key";

export interface ApiKeysProps {
  /** Main component card description */
  description?: string;
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Rotate" on confirmation modal */
  onRotateKey: (type: SubscriptionKeyTypeEnum) => void;
  /** Main component card title */
  title: string;
  /** Used to log the page where the event is triggered */
  type: "manage" | "use";
}

/** API Keys main component
 *
 * Used to show, copy, rotate `keys` _(primary/secondary)_ and edit optional `authorized cidrs`.
 * */
export const ApiKeys = (props: ApiKeysProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleRotateEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (props.type === "manage") {
      trackManageKeyRotateEvent(keyType);
    } else if (props.type === "use") {
      trackServiceKeyRotateEvent(keyType);
    }
  };

  const handleCopyEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (props.type === "manage") {
      trackManageKeyCopyEvent("apikey", keyType);
    } else if (props.type === "use") {
      trackServiceKeyCopyEvent(keyType);
    }
  };

  const handleRotate = async (keyType: SubscriptionKeyTypeEnum) => {
    const makeKeyRotation = await showDialog({
      confirmButtonLabel: t("keys.rotate.button"),
      message: t("keys.rotate.modal.description"),
      title: t("keys.rotate.modal.title"),
    });
    if (makeKeyRotation) {
      props.onRotateKey(keyType);
      handleRotateEventMixpanel(keyType);
    } else {
      console.warn("Operation canceled");
    }
  };

  return (
    <Box
      bgcolor="background.paper"
      borderRadius={0.5}
      id="card-details"
      padding={3}
    >
      <Typography variant="h6">{t(props.title)}</Typography>
      <Typography
        color="text.secondary"
        marginBottom={3}
        marginTop={1}
        variant="body2"
      >
        {props.description ? t(props.description) : ""}
      </Typography>
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.primary}
        keyValue={props.keys?.primary_key}
        onBlockClick={(kt) => console.log("onBlockClick:", kt)}
        onCopyClick={() => {
          handleCopyEventMixpanel(SubscriptionKeyTypeEnum.primary);
        }}
        onRotateClick={handleRotate}
      />
      <Divider sx={{ marginTop: 3 }} />
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.secondary}
        keyValue={props.keys?.secondary_key}
        onBlockClick={(kt) => console.log("onBlockClick:", kt)}
        onCopyClick={() => {
          handleCopyEventMixpanel(SubscriptionKeyTypeEnum.secondary);
        }}
        onRotateClick={handleRotate}
      />
    </Box>
  );
};
