import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { ApiKeyScopeType } from "@/types/api-key";
import {
  trackGroupKeyCopyEvent,
  trackManageKeyCopyEvent,
  trackServiceKeyCopyEvent,
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
  /** Used to define scope: **manage** _(root or group)_ or **use** */
  scope: ApiKeyScopeType;
}

/** API Keys key-couple (primary/secondary) component */
export const ApiKeysCouple = ({
  keys,
  onRegenerateKey,
  scope,
}: ApiKeysCoupleProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleCopyEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (scope === "manageRoot") {
      trackManageKeyCopyEvent("apikey", keyType);
    } else if (scope === "manageGroup") {
      trackGroupKeyCopyEvent(keyType);
    } else {
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
        scope={scope}
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
        scope={scope}
      />
    </>
  );
};
