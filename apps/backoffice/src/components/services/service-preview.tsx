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
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { MarkdownView } from "../markdown-view";

export type ServicePreviewProps = {
  isOpen: boolean;
  name?: string;
  institutionName?: string;
  description: string;
  onChange: (isOpen: boolean) => void;
};

/** Render a minimal service preview */
export const ServicePreview = ({
  isOpen,
  name,
  institutionName,
  description,
  onChange
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
    <Dialog open={isDialogOpen} onClose={handleClose} disableScrollLock>
      <DialogTitle>{t("service.preview.title")}</DialogTitle>
      <DialogContent sx={{ minWidth: "600px" }}>
        <Alert severity="info">
          <Typography variant="body2">{t("service.preview.info")}</Typography>
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
          <Grid item xs="auto" paddingTop={1} paddingRight={1}>
            <AccountBalanceRounded color="disabled" fontSize="large" />
          </Grid>
          <Grid
            item
            xs={12}
            marginTop={3}
            sx={{
              fontSize: "16px",
              lineHeight: "22px",
              "& a": {
                color: "#0073E6",
                textDecoration: "underline",
                fontWeight: 600
              }
            }}
          >
            <MarkdownView>{description}</MarkdownView>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ paddingX: 3, paddingY: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          {t("buttons.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
