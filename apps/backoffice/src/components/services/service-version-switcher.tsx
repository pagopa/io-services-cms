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
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ChangeEvent, useEffect, useState } from "react";
import { ServiceStatus } from ".";

export type ServiceVersionSwitcherType = "lifecycle" | "publication";

export type ServiceVersionSwitcherProps = {
  service?: ServiceListItem;
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
  onVersionSelected: (
    serviceId: string,
    version: ServiceVersionSwitcherType
  ) => void;
};

/** Renders a modal dialog to choose the two versions (last approved or current) of a service. \
 * _(the Publication one and a different Lifecycle one)_. */
export const ServiceVersionSwitcher = ({
  service,
  isOpen,
  onChange,
  onVersionSelected
}: ServiceVersionSwitcherProps) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [selectedVersion, setSelectedVersion] = useState<
    ServiceVersionSwitcherType
  >("lifecycle");

  const handelVersionChanged = (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean
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
    isLastApprovedVersion?: boolean
  ) => (
    <Box
      marginTop={1}
      padding={2}
      border="solid"
      borderRadius={4}
      borderColor={
        type === selectedVersion ? "primary.light" : "background.default"
      }
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Radio
          checked={selectedVersion === type}
          onChange={handelVersionChanged}
          value={type}
          name="radio-buttons"
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
                    value: ServiceLifecycleStatusTypeEnum.draft
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
    <Dialog open={isDialogOpen} onClose={handleClose} disableScrollLock>
      <DialogTitle
        sx={{
          width: "425px",
          fontWeight: 700,
          textAlign: "center",
          paddingX: 4,
          paddingTop: 4
        }}
      >
        <Box marginBottom={1}>
          <CallSplit fontSize="small" />
        </Box>
        {t("service.switcher.title")}
      </DialogTitle>
      <DialogContent
        sx={{ width: "425px", textAlign: "center", paddingX: 4, paddingY: 0 }}
      >
        <Box marginBottom={4}>
          <span
            dangerouslySetInnerHTML={{
              __html: t(`service.switcher.description`, {
                name: service?.name
              })
            }}
          />
        </Box>
        {renderServiceVersionChoice("publication", true)}
        {renderServiceVersionChoice("lifecycle")}
      </DialogContent>
      <DialogActions sx={{ padding: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="text"
              sx={{ fontWeight: 700 }}
              onClick={handleClose}
            >
              {t("buttons.cancel")}
            </Button>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Button
              variant="contained"
              sx={{ fontWeight: 700 }}
              onClick={handleConfirm}
            >
              {t("buttons.view")}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
