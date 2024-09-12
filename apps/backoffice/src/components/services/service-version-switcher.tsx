import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceListItem } from "@/generated/api/ServiceListItem";
import { CallSplit } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { ChangeEvent, useEffect, useState } from "react";

import { ServiceStatus } from ".";

export type ServiceVersionSwitcherType = "lifecycle" | "publication";

export interface ServiceVersionSwitcherProps {
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
  onVersionSelected: (
    serviceId: string,
    version: ServiceVersionSwitcherType,
  ) => void;
  service?: ServiceListItem;
}

/** Renders a modal dialog to choose the two versions (last approved or current) of a service. \
 * _(the Publication one and a different Lifecycle one)_. */
export const ServiceVersionSwitcher = ({
  isOpen,
  onChange,
  onVersionSelected,
  service,
}: ServiceVersionSwitcherProps) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [selectedVersion, setSelectedVersion] =
    useState<ServiceVersionSwitcherType>("lifecycle");

  const handelVersionChanged = (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedVersion(event.target.value as ServiceVersionSwitcherType);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    onChange(false);
  };

  const handleConfirm = () => {
    onVersionSelected(service?.id as string, selectedVersion);
    setIsDialogOpen(false);
    onChange(false);
  };

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  const renderServiceVersionChoice = (
    type: ServiceVersionSwitcherType,
    isLastApprovedVersion?: boolean,
  ) => (
    <Box
      border="solid"
      borderColor={
        type === selectedVersion ? "primary.light" : "background.default"
      }
      borderRadius={4}
      marginTop={1}
      padding={2}
    >
      <Stack alignItems="center" direction="row" spacing={1}>
        <Radio
          checked={selectedVersion === type}
          name="radio-buttons"
          onChange={handelVersionChanged}
          value={type}
        />
        <Box>
          <Stack direction="row" spacing={1}>
            <Typography variant="body2">
              {t("service.switcher.status")}
            </Typography>
            {isLastApprovedVersion ? (
              <ServiceStatus
                status={{ value: ServiceLifecycleStatusTypeEnum.approved }}
              />
            ) : (
              <ServiceStatus
                status={
                  service?.status ?? {
                    value: ServiceLifecycleStatusTypeEnum.draft,
                  }
                }
              />
            )}
          </Stack>
          <Typography variant="caption">
            {isLastApprovedVersion ? (
              <>{t("service.switcher.lastApprovedVersion")}</>
            ) : (
              <>
                {t("service.switcher.lastUpdate")}{" "}
                <strong>
                  {new Date(service?.last_update as string).toLocaleString()}
                </strong>
              </>
            )}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Dialog disableScrollLock onClose={handleClose} open={isDialogOpen}>
      <DialogTitle
        sx={{
          fontWeight: 700,
          paddingTop: 4,
          paddingX: 4,
          textAlign: "center",
          width: "425px",
        }}
      >
        <Box marginBottom={1}>
          <CallSplit fontSize="small" />
        </Box>
        {t("service.switcher.title")}
      </DialogTitle>
      <DialogContent
        sx={{ paddingX: 4, paddingY: 0, textAlign: "center", width: "425px" }}
      >
        <Box marginBottom={4}>
          <Trans i18nKey="service.switcher.description">
            Il servizio <strong>{service?.name}</strong> ha due versioni.
            Seleziona quella che vuoi visualizzare.
          </Trans>
        </Box>
        {renderServiceVersionChoice("publication", true)}
        {renderServiceVersionChoice("lifecycle")}
      </DialogContent>
      <DialogActions sx={{ padding: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              onClick={handleClose}
              sx={{ fontWeight: 700 }}
              variant="text"
            >
              {t("buttons.cancel")}
            </Button>
          </Grid>
          <Grid item textAlign="right" xs={6}>
            <Button
              onClick={handleConfirm}
              sx={{ fontWeight: 700 }}
              variant="contained"
            >
              {t("buttons.view")}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
