import { Close, InfoOutlined } from "@mui/icons-material";
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
import { useTranslation } from "next-i18next";
import { useState } from "react";
import ServicePreview from "./service-preview";
import PhoneFrame from "./phone-frame";
import { Service } from "@/types/service";
import { IconButtonClose } from "../buttons";

type AppPreviewProps = {
  itemToPreview?: Service;
  showPreview: boolean;
  onClose: () => void;
};

const ScrollInfoBox = (toggleInfobBox: () => void, infoboxText: string) => {
  return (
    <Stack
      width={140}
      height={122}
      padding={1}
      borderRadius={2}
      sx={{
        zIndex: 99,
        position: "absolute",
        right: 100,
        backgroundColor: "white",
        boxShadow: "-5px 5px 30px gray"
      }}
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
        <Typography fontSize="10px" textAlign="center" fontWeight="600">
          {infoboxText}
        </Typography>
      </Box>
    </Stack>
  );
};

//service.inAppPreview.closeButton

export const AppPreview = ({
  itemToPreview,
  showPreview,
  onClose
}: AppPreviewProps) => {
  const { t } = useTranslation();
  const [isInfoOpen, setisInfoOpen] = useState(true);

  const toggleInfoBox = () => {
    setisInfoOpen(!isInfoOpen);
  };

  return (
    <Dialog open={showPreview} onClose={onClose} disableScrollLock>
      <Stack
        flexDirection={"column"}
        sx={{ minWidth: 600, minHeight: 640 }}
        padding={4}
        gap={2}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8}>
            <Stack direction={"row"} gap={1}>
              <Typography fontWeight={700} variant="h6">
                {t("service.inAppPreview.title")}
              </Typography>
              <Tooltip
                title={t("service.inAppPreview.titleTooltip")}
                placement="right"
                arrow
              >
                <InfoOutlined color="disabled" />
              </Tooltip>
            </Stack>
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
