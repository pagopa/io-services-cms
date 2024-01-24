import { obscure } from "@/utils/string-util";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";

export type ApiKeyValueProps = {
  isVisible: boolean;
  keyValue?: string;
};

/** API Key value component */
export const ApiKeyValue = ({ isVisible, keyValue }: ApiKeyValueProps) => {
  const { t } = useTranslation();

  const renderKeyValue = (value: string) => (
    <Typography variant="monospaced" noWrap>
      {isVisible ? value : obscure(value)}
    </Typography>
  );

  return (
    <Box paddingY={1} paddingX={1.5} bgcolor="background.default" overflow="auto">
      <Stack direction="row" alignItems={"center"} spacing={0.5}>
        <LoaderSkeleton loading={keyValue === undefined}>
          {renderKeyValue(keyValue ?? "--------------------------------")}
          <CopyToClipboard text={keyValue ?? ""} />
        </LoaderSkeleton>
      </Stack>
    </Box>
  );
};
