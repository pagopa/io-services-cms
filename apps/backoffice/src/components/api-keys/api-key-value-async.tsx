import {
  API_KEY_VALUE_PLACEHOLDER,
  INVALID_API_KEY_VALUE_PLACEHOLDER,
  obscure,
} from "@/utils/string-util";
import { Box, Stack, Typography } from "@mui/material";

import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";

export interface ApiKeyValueAsyncProps {
  isLoading: boolean;
  isVisible: boolean;
  keyValue?: string;
  onCopyToClipboardClick?: () => void;
  onRequestCopyToClipboard?: () => void;
}

/** Asynchronous API Key value component */
export const ApiKeyValueAsync = ({
  isLoading,
  isVisible,
  keyValue,
  onCopyToClipboardClick,
  onRequestCopyToClipboard,
}: ApiKeyValueAsyncProps) => {
  const renderKeyValue = (value: string) => (
    <Typography noWrap variant="monospaced">
      {isVisible ? value : obscure(value)}
    </Typography>
  );

  /**
   * Handle Copy to Clipboard action
   * @param isCtcLoading
   * @returns
   */
  const handleOnLoadingStateChanged = (isCtcLoading: boolean) => {
    if (isCtcLoading && onRequestCopyToClipboard)
      return onRequestCopyToClipboard();
  };

  return (
    <Box
      bgcolor="background.default"
      overflow="auto"
      paddingX={1.5}
      paddingY={1}
    >
      <Stack alignItems={"center"} direction="row" spacing={0.5}>
        <LoaderSkeleton loading={isLoading}>
          {renderKeyValue(keyValue ?? API_KEY_VALUE_PLACEHOLDER)}
          {keyValue !== INVALID_API_KEY_VALUE_PLACEHOLDER ? (
            <CopyToClipboard
              asyncMode
              isLoading={isLoading}
              onCopyClick={onCopyToClipboardClick}
              onLoadingStateChanged={handleOnLoadingStateChanged}
              text={keyValue ?? ""}
            />
          ) : null}
        </LoaderSkeleton>
      </Stack>
    </Box>
  );
};
