import { useState } from "react";
import { useTranslation } from "next-i18next";
import { IconButton, Tooltip } from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";

export type CopyToClipboardProps = {
  text: string;
};

/**
 * _"Copy to clipboard"_ utility button icon.
 */
export const CopyToClipboard = ({ text }: CopyToClipboardProps) => {
  const { t } = useTranslation();

  const [copyState, setCopyState] = useState({
    copied: false,
    tooltip: t("buttons.copyToClipboard")
  });

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(text);
    setCopyState({
      copied: true,
      tooltip: t("copied")
    });
    const timer = setTimeout(() => {
      setCopyState({
        copied: false,
        tooltip: t("buttons.copyToClipboard")
      });
    }, 2000);
    return () => clearTimeout(timer);
  };

  return (
    <Tooltip title={copyState.tooltip} placement="top">
      <IconButton
        aria-label={copyState.tooltip}
        color="primary"
        size="small"
        sx={{ height: "22px", width: "22px" }}
        onClick={copyToClipboard}
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
