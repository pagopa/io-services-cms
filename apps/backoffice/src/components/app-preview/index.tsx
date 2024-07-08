import { Service } from "@/types/service";
import { Close, Edit, InfoOutlined } from "@mui/icons-material";
import MouseIcon from "@mui/icons-material/Mouse";
import {
  Box,
  Button,
  Dialog,
  Grid,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useState } from "react";
import { IconButtonClose } from "../buttons";
import PhoneFrame from "./phone-frame";
import ServicePreview from "./service-preview";

type AppPreviewProps = {
  itemToPreview?: Service;
  showPreview: boolean;
  editUrl?: string;
  onClose: () => void;
};

const ScrollInfoBox = (toggleInfobBox: () => void, infoboxText: string) => {
  return (
    <Stack
      width={180}
      height={150}
      padding={1}
      borderRadius={2}
      bgcolor="background.paper"
      zIndex={99}
      position="absolute"
      right={50}
      boxShadow="-5px 5px 30px gray"
    >
      <Box display="flex" justifyContent="flex-end">
        <Button
          onClick={toggleInfobBox}
          variant="text"
          style={{
            height: 24,
            minWidth: 24,
            padding: 0,
            backgroundColor: "transparent"
          }}
        >
          <Close fontSize="small" />
        </Button>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        paddingBottom={1}
      >
        <MouseIcon color="action" />
        <Typography fontSize={14} textAlign="center" fontWeight="600">
          {infoboxText}
        </Typography>
      </Box>
    </Stack>
  );
};

export const AppPreview = ({
  itemToPreview,
  showPreview,
  editUrl,
  onClose
}: AppPreviewProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isInfoOpen, setisInfoOpen] = useState(true);

  const toggleInfoBox = () => {
    setisInfoOpen(!isInfoOpen);
  };

  return (
    <Dialog open={showPreview} onClose={onClose} disableScrollLock>
      <Stack
        flexDirection={"column"}
        sx={{ minWidth: 600 }}
        padding={2.5}
        gap={1.5}
      >
        <Grid container spacing={0} alignItems="center">
          <Grid item xs={8}>
            <Stack direction={"row"} gap={1}>
              <Typography fontWeight={700} variant="h6">
                {t("service.inAppPreview.title")}
              </Typography>
              <Tooltip
                title={t("service.inAppPreview.titleTooltip")}
                placement="bottom"
                arrow
              >
                <InfoOutlined color="disabled" />
              </Tooltip>
            </Stack>
            {editUrl && (
              <ButtonNaked
                color="primary"
                endIcon={<Edit fontSize="small" />}
                size="medium"
                sx={{ marginTop: 1, fontWeight: 700 }}
                onClick={() => router.push(editUrl)}
              >
                {t("service.actions.edit")}
              </ButtonNaked>
            )}
          </Grid>
          <Grid item xs={4} textAlign="right">
            <IconButtonClose onClick={onClose} />
          </Grid>
        </Grid>
        <Box
          flexGrow={1}
          paddingY={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            backgroundImage: "url('/img/app_preview_bg.png')",
            backgroundSize: "cover"
          }}
        >
          {isInfoOpen &&
            ScrollInfoBox(toggleInfoBox, t("service.inAppPreview.scrollInfo"))}
          <PhoneFrame>
            <ServicePreview service={itemToPreview} />
          </PhoneFrame>
        </Box>
      </Stack>
    </Dialog>
  );
};
