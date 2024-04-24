import { Close, Info, InfoOutlined, Title } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";

type AppPreviewProps = {
  showPreview: boolean;
  onClose: () => void;
};

export const AppPreview = ({ showPreview, onClose }: AppPreviewProps) => {
  const { t } = useTranslation();
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(showPreview);

  useEffect(() => {
    setIsPreviewOpen(showPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview]);

  return (
    <Dialog open={isPreviewOpen} onClose={onClose} disableScrollLock>
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
          sx={{
            backgroundImage: "url('/img/app_preview_bg.png')",
            backgroundSize: "cover"
          }}
        ></Box>
        <Box textAlign={"center"}>
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
