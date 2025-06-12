import { isNullUndefinedOrEmpty } from "@/utils/string-util";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export interface CopyToClipboardProps {
  /** If `true`, value could be setted asyncronously.
   * _(means that if `text` is empty, a loading state and a callback event will be fired)_
   * */
  asyncMode?: boolean;
  isLoading?: boolean;
  onCopyClick?: () => void;
  onLoadingStateChanged?: (loading: boolean) => void;
  text?: string;
}

/**
 * _"Copy to clipboard"_ utility button icon.
 */
export const CopyToClipboard = ({
  asyncMode,
  isLoading,
  onCopyClick,
  onLoadingStateChanged,
  text = "",
}: CopyToClipboardProps) => {
  const { t } = useTranslation();

  const [isLoadingState, setIsLoadingState] = useState<boolean>(!!isLoading);
  const [copyState, setCopyState] = useState({
    copied: false,
    tooltip: t("buttons.copyToClipboard"),
  });

  const copyToClipboard = () => {
    if (asyncMode && isNullUndefinedOrEmpty(text)) {
      setIsLoadingState(true);
      if (onLoadingStateChanged) onLoadingStateChanged(true);
    } else {
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
        if (onCopyClick) onCopyClick();
      }, 2000);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    if (asyncMode && isLoadingState && !isNullUndefinedOrEmpty(text)) {
      setIsLoadingState(false);
      copyToClipboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return isLoadingState ? (
    <CircularProgress size={20} />
  ) : (
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
