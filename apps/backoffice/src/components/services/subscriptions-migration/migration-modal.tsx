import { LoaderSkeleton } from "@/components/loaders";
import { MigrationData } from "@/generated/api/MigrationData";
import logToMixpanel from "@/utils/mix-panel";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { DelegateStatusPair, MigrationStatus } from "./migration-manager";

export interface MigrationModalProps {
  isOpen: boolean;
  migrationStatusList?: DelegateStatusPair[];
  onImportClick: (delegates: string[]) => void;
  onOpenChange: (isOpen: boolean) => void;
}

// porting from developer portal frontend
export const computeMigrationStatus = (
  migrationData?: MigrationData,
): MigrationStatus => {
  if (migrationData?.data?.failed) {
    return "failed";
  }
  if (migrationData?.data?.initial) {
    return "todo";
  }
  if (migrationData?.data?.processing) {
    return "doing";
  }
  return "done";
};

/** Render subscriptions migration modal:
 * - a list of selectable delegates for which to start the import */
export const MigrationModal = ({
  isOpen,
  migrationStatusList,
  onImportClick,
  onOpenChange,
}: MigrationModalProps) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [checkedDelegates, setCheckedDelegates] = useState<string[]>([]);

  const handleClose = () => {
    onOpenChange(false);
    setCheckedDelegates([]);
  };

  const handleImport = () => {
    onImportClick(checkedDelegates);
    onOpenChange(false);
    setCheckedDelegates([]);
    logToMixpanel("IO_BO_SERVICES_IMPORT_START", {
      delegates: checkedDelegates
    });
  };

  const handleToggle = (delegateId: string) => () => {
    const currentIndex = checkedDelegates.indexOf(delegateId);
    const newChecked = [...checkedDelegates];

    if (currentIndex === -1) {
      newChecked.push(delegateId);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setCheckedDelegates(newChecked);
  };

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  return (
    <Dialog disableScrollLock onClose={handleClose} open={isDialogOpen}>
      <DialogTitle>{t("subscriptions.migration.action")}</DialogTitle>
      <DialogContent sx={{ width: "480px" }}>
        <Alert severity="info">
          <AlertTitle>{t("subscriptions.migration.modal.title")}</AlertTitle>
          <Typography variant="body2">
            {t("subscriptions.migration.modal.description")}
          </Typography>
        </Alert>
        <List>
          <LoaderSkeleton
            loading={migrationStatusList === undefined}
            style={{ height: "50px", width: "100%" }}
          >
            {migrationStatusList?.map((migrationItem, index) => {
              const labelId = `checkbox-list-label-${migrationItem.delegate?.sourceId}`;
              return (
                <ListItem key={index} sx={{ padding: 0 }}>
                  <ListItemButton
                    dense
                    disabled={
                      !["failed", "todo"].includes(
                        computeMigrationStatus(migrationItem.data),
                      )
                    }
                    onClick={handleToggle(migrationItem.delegate.sourceId)}
                    role={undefined}
                    sx={{ paddingY: 0 }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={
                          checkedDelegates.indexOf(
                            migrationItem.delegate.sourceId,
                          ) !== -1
                        }
                        disableRipple
                        edge="start"
                        inputProps={{ "aria-labelledby": labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={`${migrationItem.delegate?.sourceSurname} ${migrationItem.delegate?.sourceName}`}
                      sx={{ marginLeft: 1 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </LoaderSkeleton>
        </List>
      </DialogContent>
      <DialogActions sx={{ paddingX: 3, paddingY: 2 }}>
        <Grid container>
          <Grid item xs={6}>
            <Button onClick={handleClose} variant="outlined">
              {t("buttons.close")}
            </Button>
          </Grid>
          <Grid item textAlign="right" xs={6}>
            <Button
              disabled={checkedDelegates.length === 0}
              onClick={handleImport}
              variant="contained"
            >
              {t("buttons.import")}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
