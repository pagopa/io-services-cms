import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { Box, Divider, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useDialog } from "../dialog-provider";
import { ApiSingleKey } from "./api-single-key";

export type ApiKeysProps = {
  /** Main component card title */
  title: string;
  /** Main component card description */
  description?: string;
  /** Api key values */
  keys?: SubscriptionKeys;
  /** Event triggered when user click "Rotate" on confirmation modal */
  onRotateKey: (type: SubscriptionKeyTypeEnum) => void;
};

/** API Keys main component
 *
 * Used to show, copy, rotate `keys` _(primary/secondary)_ and edit optional `authorized cidrs`.
 * */
export const ApiKeys = (props: ApiKeysProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleRotate = async (keyType: SubscriptionKeyTypeEnum) => {
    const makeKeyRotation = await showDialog({
      title: t("keys.rotate.modal.title"),
      message: t("keys.rotate.modal.description"),
      confirmButtonLabel: t("keys.rotate.button")
    });
    if (makeKeyRotation) {
      props.onRotateKey(keyType);
    } else {
      console.warn("Operation canceled");
    }
  };

  return (
    <Box
      bgcolor="background.paper"
      id="card-details"
      padding={3}
      borderRadius={0.5}
    >
      <Typography variant="h6">{t(props.title)}</Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        marginTop={1}
        marginBottom={3}
      >
        {props.description ? t(props.description) : ""}
      </Typography>
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.primary}
        keyValue={props.keys?.primary_key}
        onRotateClick={handleRotate}
        onBlockClick={kt => console.log("onBlockClick:", kt)}
      />
      <Divider sx={{ marginTop: 3 }} />
      <ApiSingleKey
        keyType={SubscriptionKeyTypeEnum.secondary}
        keyValue={props.keys?.secondary_key}
        onRotateClick={handleRotate}
        onBlockClick={kt => console.log("onBlockClick:", kt)}
      />
    </Box>
  );
};
