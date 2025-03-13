import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import {
  trackManageKeyCopyEvent,
  trackManageKeyRegenerateEvent,
  trackServiceKeyCopyEvent,
  trackServiceKeyRegenerateEvent,
} from "@/utils/mix-panel";
import { Divider } from "@mui/material";
import { useTranslation } from "next-i18next";

import { useDialog } from "../dialog-provider";
import { ApiSingleKey } from "./api-single-key";

export interface ApiKeysCoupleProps {
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Regenerate" on confirmation modal */
  onRegenerateKey: (type: SubscriptionKeyTypeEnum) => void;
  /** Used to track the page where the event is triggered */
  type: "manage" | "use";
}

/** API Keys key-couple (primary/secondary) component */
export const ApiKeysCouple = ({
  keys,
  onRegenerateKey,
  type,
}: ApiKeysCoupleProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleRegenerateEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (type === "manage") {
      trackManageKeyRegenerateEvent(keyType);
    } else if (type === "use") {
      trackServiceKeyRegenerateEvent(keyType);
    }
  };

  const handleCopyEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (type === "manage") {
      trackManageKeyCopyEvent("apikey", keyType);
    } else if (type === "use") {
      trackServiceKeyCopyEvent(keyType);
    }
  };

  const handleRegenerate = async (keyType: SubscriptionKeyTypeEnum) => {
    const makeKeyRegeneration = await showDialog({
      confirmButtonLabel: t("keys.regenerate.button"),
      message: t("keys.regenerate.modal.description"),
      title: t("keys.regenerate.modal.title"),
    });
    if (makeKeyRegeneration) {
      onRegenerateKey(keyType);
      handleRegenerateEventMixpanel(keyType);
    } else {
      console.warn("Operation canceled");
    }
  };

  return (
    <>
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.primary}
        keyValue={keys?.primary_key}
        onBlockClick={(kt) => console.log("onBlockClick:", kt)}
        onCopyClick={() => {
          handleCopyEventMixpanel(SubscriptionKeyTypeEnum.primary);
        }}
        onRegenerateClick={handleRegenerate}
        type={type}
      />
      <Divider sx={{ marginTop: 3 }} />
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.secondary}
        keyValue={keys?.secondary_key}
        onBlockClick={(kt) => console.log("onBlockClick:", kt)}
        onCopyClick={() => {
          handleCopyEventMixpanel(SubscriptionKeyTypeEnum.secondary);
        }}
        onRegenerateClick={handleRegenerate}
        type={type}
      />
    </>
  );
};
