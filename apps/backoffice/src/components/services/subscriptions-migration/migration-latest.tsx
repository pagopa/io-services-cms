import { LoaderSkeleton } from "@/components/loaders";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { MigrationItemStatus } from "@/generated/api/MigrationItemStatus";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { Fragment } from "react";
import { MigrationChipStatus } from ".";

export type MigrationLatestProps = {
  migrationItems?: MigrationItemList;
  onRefreshClick: () => void;
};

/** Render subscriptions migration latest summary status */
export const MigrationLatest = ({
  migrationItems,
  onRefreshClick
}: MigrationLatestProps) => {
  const { t } = useTranslation();
  const isEmptyState = migrationItems?.items?.length === 0;

  // the full migration status report is reduced so that it's ready to be rendered
  const computeMigrationStatus = (
    status: MigrationItemStatus
  ): MigrationChipStatus => {
    // at least one failed mean the overall process failed
    return status.failed > 0
      ? { label: "failed", color: "error" }
      : // at least one still processing means the overall process still processing
      status.processing > 0
      ? { label: "doing", color: "warning" }
      : // for every other case, we consider it done
        { label: "done", color: "success" };
  };

  return (
    <Stack direction="column" spacing={3}>
      <Box>
        <Typography variant="overline">
          {t("subscriptions.migration.status.title")}
        </Typography>
        <Typography variant="body2">
          {t("subscriptions.migration.status.description")}
        </Typography>
        <Button
          size="small"
          variant="naked"
          sx={{ marginTop: 1 }}
          startIcon={<Refresh />}
          onClick={onRefreshClick}
        >
          {t("subscriptions.migration.refresh")}
        </Button>
      </Box>
      {isEmptyState ? (
        <Alert severity="info">
          {t("subscriptions.migration.status.noData")}
        </Alert>
      ) : null}
      <LoaderSkeleton
        loading={migrationItems === undefined}
        style={{ width: "100%", height: "50px" }}
      >
        <Grid container direction="row" alignItems="center">
          {migrationItems?.items
            ?.map(item => ({
              ...item,
              status: computeMigrationStatus(item.status)
            }))
            .map((migrationItem, index) => (
              <Fragment key={`migration-lates-${index}`}>
                <Grid item xs={4} marginY={1}>
                  <Typography variant="body2">
                    {`${migrationItem.delegate.sourceSurname} ${migrationItem.delegate.sourceName}`}
                  </Typography>
                </Grid>
                <Grid item xs={4} paddingLeft={1}>
                  <Chip
                    size="small"
                    label={t(
                      `subscriptions.migration.status.${migrationItem.status.label}`
                    )}
                    color={migrationItem.status.color}
                  />
                </Grid>
                <Grid item xs paddingLeft={1}>
                  <Typography variant="body2">
                    {new Date(migrationItem.lastUpdate).toLocaleString()}
                  </Typography>
                </Grid>
              </Fragment>
            ))}
        </Grid>
      </LoaderSkeleton>
    </Stack>
  );
};
