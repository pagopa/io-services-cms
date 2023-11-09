import { LoaderSkeleton } from "@/components/loaders";
import { MigrationData } from "@/generated/api/MigrationData";
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
import { DelegateStatusPair, MigrationStatus } from ".";

export type MigrationModalProps = {
  isOpen: boolean;
  migrationStatusList?: DelegateStatusPair[];
  onOpenChange: (isOpen: boolean) => void;
  onImportClick: (delegates: string[]) => void;
};

/** Render subscriptions migration modal:
 * - a list of selectable delegates for which to start the import */
export const MigrationModal = ({
  isOpen,
  migrationStatusList,
  onOpenChange,
  onImportClick
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

  // porting from developer portal frontend
  const computeMigrationStatus = (data?: MigrationData): MigrationStatus => {
    if (data?.status?.failed ?? 0 > 0) {
      return "failed";
    }
    if (data?.status?.initial ?? 0 > 0) {
      return "todo";
    }
    if (data?.status?.processing ?? 0 > 0) {
      return "doing";
    }
    return "done";
  };

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  return (
    <Dialog open={isDialogOpen} onClose={handleClose} disableScrollLock>
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
            style={{ width: "100%", height: "50px" }}
          >
            {migrationStatusList?.map((migrationItem, index) => {
              const labelId = `checkbox-list-label-${migrationItem.delegate?.sourceId}`;
              return (
                <ListItem key={index} sx={{ padding: 0 }}>
                  <ListItemButton
                    role={undefined}
                    onClick={handleToggle(migrationItem.delegate.sourceId)}
                    dense
                    sx={{ paddingY: 0 }}
                    disabled={
                      !["todo", "failed"].includes(
                        computeMigrationStatus(migrationItem.data)
                      )
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={
                          checkedDelegates.indexOf(
                            migrationItem.delegate.sourceId
                          ) !== -1
                        }
                        disableRipple
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
            <Button variant="outlined" onClick={handleClose}>
              {t("buttons.close")}
            </Button>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={checkedDelegates.length === 0}
            >
              {t("buttons.import")}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
