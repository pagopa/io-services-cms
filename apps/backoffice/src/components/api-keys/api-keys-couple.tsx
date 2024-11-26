import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { Divider } from "@mui/material";
import { useTranslation } from "next-i18next";

import { useDialog } from "../dialog-provider";
import { ApiSingleKey } from "./api-single-key";

export interface ApiKeysCoupleProps {
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Rotate" on confirmation modal */
  onRotateKey: (type: SubscriptionKeyTypeEnum) => void;
}

/** API Keys key-couple (primary/secondary) component */
export const ApiKeysCouple = ({ keys, onRotateKey }: ApiKeysCoupleProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleRotate = async (keyType: SubscriptionKeyTypeEnum) => {
    const makeKeyRotation = await showDialog({
      confirmButtonLabel: t("keys.rotate.button"),
      message: t("keys.rotate.modal.description"),
      title: t("keys.rotate.modal.title"),
    });
    if (makeKeyRotation) {
      onRotateKey(keyType);
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
        onRotateClick={handleRotate}
      />
      <Divider sx={{ marginTop: 3 }} />
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.secondary}
        keyValue={keys?.secondary_key}
        onBlockClick={(kt) => console.log("onBlockClick:", kt)}
        onRotateClick={handleRotate}
      />
    </>
  );
};
