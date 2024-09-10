import { AccountBalanceRounded } from "@mui/icons-material";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { MarkdownView } from "../markdown-view";

export interface ServicePreviewProps {
  description: string;
  institutionName?: string;
  isOpen: boolean;
  name?: string;
  onChange: (isOpen: boolean) => void;
}

/** Render a minimal service preview */
export const ServicePreview = ({
  description,
  institutionName,
  isOpen,
  name,
  onChange,
}: ServicePreviewProps) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);

  const handleClose = () => {
    setIsDialogOpen(false);
    onChange(false);
  };

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  return (
    <Dialog disableScrollLock onClose={handleClose} open={isDialogOpen}>
      <DialogTitle id="s-preview-title">
        {t("service.preview.title")}
      </DialogTitle>
      <DialogContent sx={{ minWidth: "600px" }}>
        <Alert severity="info">
          <Typography id="s-preview-info" variant="body2">
            {t("service.preview.info")}
          </Typography>
        </Alert>
        <Grid container marginY={4}>
          <Grid item xs>
            <Stack direction="column">
              <Typography fontSize="20px" fontWeight={700}>
                {name}
              </Typography>
              <Typography variant="body2">{institutionName}</Typography>
            </Stack>
          </Grid>
          <Grid item paddingRight={1} paddingTop={1} xs="auto">
            <AccountBalanceRounded color="disabled" fontSize="large" />
          </Grid>
          <Grid
            item
            marginTop={3}
            sx={{
              "& a": {
                color: "#0073E6",
                fontWeight: 600,
                textDecoration: "underline",
              },
              fontSize: "16px",
              lineHeight: "22px",
            }}
            xs={12}
          >
            <MarkdownView>{description}</MarkdownView>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ paddingX: 3, paddingY: 2 }}>
        <Button
          id="s-preview-close-button"
          onClick={handleClose}
          variant="outlined"
        >
          {t("buttons.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
