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
import React, { useEffect, useState } from "react";

type AppPreviewProps = {
  showPreview: boolean;
  onClose: () => void;
};

export const AppPreview = ({ showPreview, onClose }: AppPreviewProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(showPreview);

  /** Handle close `App Preview` dialog */
  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    setIsPreviewOpen(showPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview]);

  return (
    <>
      <Dialog open={isPreviewOpen} onClose={handleClose} disableScrollLock>
        <Stack
          flexDirection={"column"}
          sx={{ minWidth: 600, minHeight: 640 }}
          padding={4}
          rowGap={"24px"}
        >
          <Stack direction={"row"} gap={1}>
            <Typography fontWeight={700} variant="h6">
              Anteprima In App IO
            </Typography>
            <Tooltip
              title={"Versione App xy di App IO"}
              placement="right"
              arrow
            >
              <InfoOutlined color="disabled" />
            </Tooltip>
          </Stack>
          <Box sx={{ with: 536, height: 467, backgroundImage: "url('/img/app_preview_bg.png')", backgroundSize: "cover" }}></Box>
          <Box textAlign={"center"}>
            <Button
              size="medium"
              startIcon={<Close />}
              id="s-preview-close-button"
              variant="text"
              onClick={handleClose}
              style={{ backgroundColor: "transparent" }}
            >
              Chiudi Anteprima
            </Button>
          </Box>
        </Stack>
      </Dialog>
    </>
  );
};
