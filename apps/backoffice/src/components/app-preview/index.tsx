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
  Typography,
} from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { IconButtonClose } from "../buttons";
import PhoneFrame from "./phone-frame";
import ServicePreview from "./service-preview";

interface AppPreviewProps {
  editUrl?: string;
  itemToPreview?: Service;
  onClose: () => void;
  showPreview: boolean;
}

const ScrollInfoBox = (toggleInfobBox: () => void, infoboxText: string) => (
  <Stack
    bgcolor="background.paper"
    borderRadius={2}
    boxShadow="-5px 5px 30px gray"
    height={150}
    padding={1}
    position="absolute"
    right={50}
    width={180}
    zIndex={99}
  >
    <Box display="flex" justifyContent="flex-end">
      <Button
        onClick={toggleInfobBox}
        style={{
          backgroundColor: "transparent",
          height: 24,
          minWidth: 24,
          padding: 0,
        }}
        variant="text"
      >
        <Close fontSize="small" />
      </Button>
    </Box>
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      gap={1}
      paddingBottom={1}
    >
      <MouseIcon color="action" />
      <Typography fontSize={14} fontWeight="600" textAlign="center">
        {infoboxText}
      </Typography>
    </Box>
  </Stack>
);

export const AppPreview = ({
  editUrl,
  itemToPreview,
  onClose,
  showPreview,
}: AppPreviewProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isInfoOpen, setisInfoOpen] = useState(true);

  const toggleInfoBox = () => {
    setisInfoOpen(!isInfoOpen);
  };

  return (
    <Dialog disableScrollLock onClose={onClose} open={showPreview}>
      <Stack
        flexDirection={"column"}
        gap={1.5}
        padding={2.5}
        sx={{ minWidth: 600 }}
      >
        <Grid alignItems="center" container spacing={0}>
          <Grid item xs={8}>
            <Stack direction={"row"} gap={1}>
              <Typography fontWeight={700} variant="h6">
                {t("service.inAppPreview.title")}
              </Typography>
              <Tooltip
                arrow
                placement="bottom"
                title={t("service.inAppPreview.titleTooltip")}
              >
                <InfoOutlined color="disabled" />
              </Tooltip>
            </Stack>
            {editUrl && (
              <ButtonNaked
                color="primary"
                endIcon={<Edit fontSize="small" />}
                onClick={() => router.push(editUrl)}
                size="medium"
                sx={{ fontWeight: 700, marginTop: 1 }}
              >
                {t("service.actions.edit")}
              </ButtonNaked>
            )}
          </Grid>
          <Grid item textAlign="right" xs={4}>
            <IconButtonClose onClick={onClose} />
          </Grid>
        </Grid>
        <Box
          alignItems="center"
          display="flex"
          flexGrow={1}
          justifyContent="center"
          paddingY={2}
          sx={{
            backgroundImage: "url('/img/app_preview_bg.png')",
            backgroundSize: "cover",
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
