import { Close, InfoOutlined } from "@mui/icons-material";
import MouseIcon from "@mui/icons-material/Mouse";
import { Box, Button, Dialog, Stack, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import styles from "./app-preview.module.css";

type AppPreviewProps = {
  showPreview: boolean;
  onClose: () => void;
};

const scrollInfoBox = (toggleInfobBox: () => void) => (
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
      <MouseIcon />
      <Typography fontSize="10px" textAlign="center" fontWeight="600">
        Lorem ipsum dolor sit amet, qui minim labore adipisicing minim.
      </Typography>{" "}
    </Box>
  </Stack>
);

export const AppPreview = ({ showPreview, onClose }: AppPreviewProps) => {
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
        rowGap={3}
      >
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
        <Box
          flexGrow={1}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            backgroundImage: "url('/img/app_preview_bg.png')",
            backgroundSize: "cover"
          }}
        >
          {isInfoOpen && scrollInfoBox(toggleInfoBox)}
          <Box
            display="flex"
            padding={1}
            borderRadius={3}
            sx={{
              width: 202,
              height: 364,
              backgroundColor: "rgba(255, 255, 255, 0.35)"
            }}
          >
            <Box
              borderRadius={2}
              flexGrow={1}
              sx={{
                backgroundColor: "white",
                overflowY: "scroll"
              }}
              className={styles.scrollbar}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 100,
                  backgroundColor: "red",
                  marginBottom: 2
                }}
              ></Box>
              <Box
                sx={{
                  width: "100%",
                  height: 100,
                  backgroundColor: "blue",
                  marginBottom: 2
                }}
              ></Box>
              <Box
                sx={{
                  width: "100%",
                  height: 100,
                  backgroundColor: "yellow",
                  marginBottom: 2
                }}
              ></Box>
              <Box
                sx={{
                  width: "100%",
                  height: 100,
                  backgroundColor: "purple",
                  marginBottom: 2
                }}
              ></Box>
            </Box>
          </Box>
        </Box>
        <Box textAlign="center">
          <Button
            size="medium"
            startIcon={<Close />}
            id="s-preview-close-button"
            variant="text"
            onClick={onClose}
            style={{ backgroundColor: "transparent" }}
          >
            {t("service.inAppPreview.closeButton")}
          </Button>
        </Box>
      </Stack>
    </Dialog>
  );
};
