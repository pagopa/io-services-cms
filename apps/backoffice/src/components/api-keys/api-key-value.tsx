import { API_KEY_VALUE_PLACEHOLDER, obscure } from "@/utils/string-util";
import { Box, Stack, Typography } from "@mui/material";

import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";

export interface ApiKeyValueProps {
  isVisible: boolean;
  keyValue?: string;
  onCopyToClipboardClick?: () => void;
}

/** API Key value component */
export const ApiKeyValue = ({
  isVisible,
  keyValue,
  onCopyToClipboardClick,
}: ApiKeyValueProps) => {
  const renderKeyValue = (value: string) => (
    <Typography noWrap variant="monospaced">
      {isVisible ? value : obscure(value)}
    </Typography>
  );

  return (
    <Box
      bgcolor="background.default"
      overflow="auto"
      paddingX={1.5}
      paddingY={1}
    >
      <Stack alignItems={"center"} direction="row" spacing={0.5}>
        <LoaderSkeleton loading={keyValue === undefined}>
          {renderKeyValue(keyValue ?? API_KEY_VALUE_PLACEHOLDER)}
          <CopyToClipboard
            onCopyClick={onCopyToClipboardClick}
            text={keyValue ?? ""}
          />
        </LoaderSkeleton>
      </Stack>
    </Box>
  );
};
