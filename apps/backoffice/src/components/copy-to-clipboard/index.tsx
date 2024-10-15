import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";

export interface CopyToClipboardProps {
  externalOnClick?: () => void;
  text: string;
}

/**
 * _"Copy to clipboard"_ utility button icon.
 */
export const CopyToClipboard = ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  externalOnClick = () => {},
  text,
}: CopyToClipboardProps) => {
  const { t } = useTranslation();

  const [copyState, setCopyState] = useState({
    copied: false,
    tooltip: t("buttons.copyToClipboard"),
  });

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(text);
    setCopyState({
      copied: true,
      tooltip: t("copied"),
    });
    const timer = setTimeout(() => {
      setCopyState({
        copied: false,
        tooltip: t("buttons.copyToClipboard"),
      });
      externalOnClick();
    }, 2000);
    return () => clearTimeout(timer);
  };

  return (
    <Tooltip placement="top" title={copyState.tooltip}>
      <IconButton
        aria-label={copyState.tooltip}
        color="primary"
        onClick={copyToClipboard}
        size="small"
        sx={{ height: "22px", width: "22px" }}
      >
        {copyState.copied ? (
          <CheckOutlinedIcon fontSize="inherit" />
        ) : (
          <ContentCopyOutlinedIcon fontSize="inherit" />
        )}
      </IconButton>
    </Tooltip>
  );
};
