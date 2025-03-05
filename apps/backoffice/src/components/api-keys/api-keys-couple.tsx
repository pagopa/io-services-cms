import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import {
  trackManageKeyCopyEvent,
  trackManageKeyRotateEvent,
  trackServiceKeyCopyEvent,
  trackServiceKeyRotateEvent,
} from "@/utils/mix-panel";
import { Divider } from "@mui/material";
import { useTranslation } from "next-i18next";

import { useDialog } from "../dialog-provider";
import { ApiSingleKey } from "./api-single-key";

export interface ApiKeysCoupleProps {
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Rotate" on confirmation modal */
  onRotateKey: (type: SubscriptionKeyTypeEnum) => void;
  /** Used to track the page where the event is triggered */
  type: "manage" | "use";
}

/** API Keys key-couple (primary/secondary) component */
export const ApiKeysCouple = ({
  keys,
  onRotateKey,
  type,
}: ApiKeysCoupleProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleRotateEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (type === "manage") {
      trackManageKeyRotateEvent(keyType);
    } else if (type === "use") {
      trackServiceKeyRotateEvent(keyType);
    }
  };

  const handleCopyEventMixpanel = (keyType: SubscriptionKeyTypeEnum) => {
    if (type === "manage") {
      trackManageKeyCopyEvent("apikey", keyType);
    } else if (type === "use") {
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
      onRotateKey(keyType);
      handleRotateEventMixpanel(keyType);
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
        onRotateClick={handleRotate}
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
        onRotateClick={handleRotate}
        type={type}
      />
    </>
  );
};
