import { SubscriptionKeyTypeEnum } from "@/generated/services-cms/SubscriptionKeyType";
import { Sync, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { ApiKeyValue } from ".";

export interface ApiSingleKeyProps {
  keyType: SubscriptionKeyTypeEnum;
  keyValue?: string;
  onBlockClick: (keyType: SubscriptionKeyTypeEnum) => void;
  onRotateClick: (keyType: SubscriptionKeyTypeEnum) => void;
}

/** Single API Key component */
export const ApiSingleKey = ({
  keyType,
  keyValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBlockClick,
  onRotateClick,
}: ApiSingleKeyProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Grid columnSpacing={4} container rowSpacing={3}>
      <Grid item xs="auto">
        <Box>
          <Typography fontWeight={600} variant="body2">
            {t(`keys.${keyType}.title`)}
            <IconButton
              aria-label="show-hide"
              color="primary"
              onClick={(_) => setIsVisible(!isVisible)}
              sx={{ margin: 1 }}
            >
              {isVisible ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          </Typography>
        </Box>
        <ApiKeyValue isVisible={isVisible} keyValue={keyValue} />
      </Grid>
      <Grid
        display="flex"
        flexDirection="column"
        item
        justifyContent="end"
        sm={6}
        xs={12}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-start"
          spacing={2}
        >
          <Button
            onClick={() => onRotateClick(keyType)}
            size="small"
            startIcon={<Sync fontSize="inherit" />}
            variant="outlined"
          >
            {t("keys.rotate.button")}
          </Button>
          {/* <Button //TODO not yet implemented
            variant="outlined"
            size="small"
            startIcon={<Block fontSize="inherit" />}
            color="error"
            onClick={() => onBlockClick(keyType)}
            disabled
          >
            {t("keys.block")}
          </Button> */}
        </Stack>
      </Grid>
    </Grid>
  );
};
