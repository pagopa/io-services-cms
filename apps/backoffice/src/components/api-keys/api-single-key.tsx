import { SubscriptionKeyTypeEnum } from "@/generated/services-cms/SubscriptionKeyType";
import { Block, Sync, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { ApiKeyValue } from ".";

export type ApiSingleKeyProps = {
  keyType: SubscriptionKeyTypeEnum;
  keyValue?: string;
  onRotateClick: (keyType: SubscriptionKeyTypeEnum) => void;
  onBlockClick: (keyType: SubscriptionKeyTypeEnum) => void;
};

/** Single API Key component */
export const ApiSingleKey = ({
  keyType,
  keyValue,
  onRotateClick,
  onBlockClick
}: ApiSingleKeyProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Grid container rowSpacing={3} columnSpacing={4}>
      <Grid item xs="auto">
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {t(`keys.${keyType}.title`)}
            <IconButton
              aria-label="show-hide"
              sx={{ margin: 1 }}
              onClick={_ => setIsVisible(!isVisible)}
              color="primary"
            >
              {isVisible ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          </Typography>
        </Box>
        <ApiKeyValue keyValue={keyValue} isVisible={isVisible} />
      </Grid>
      <Grid
        item
        xs={12}
        sm={6}
        display="flex"
        flexDirection="column"
        justifyContent="end"
      >
        <Stack
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          spacing={2}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<Sync fontSize="inherit" />}
            onClick={() => onRotateClick(keyType)}
          >
            {t("keys.rotate.button")}
          </Button>
          <Button //TODO not yet implemented
            variant="outlined"
            size="small"
            startIcon={<Block fontSize="inherit" />}
            color="error"
            onClick={() => onBlockClick(keyType)}
            disabled
          >
            {t("keys.block")}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};
