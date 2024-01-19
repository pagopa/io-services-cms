import { LoaderSkeleton } from "@/components/loaders";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { MigrationItemStatus } from "@/generated/api/MigrationItemStatus";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
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
    <Stack direction="column" spacing={3} display="contents">
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
        <Alert severity="info" sx={{ width: "100%" }}>
          {t("subscriptions.migration.status.noData")}
        </Alert>
      ) : null}
      <LoaderSkeleton
        loading={migrationItems === undefined}
        style={{ width: "100%", height: "50px" }}
      >
        <TableContainer>
          <Table size="small">
            <TableBody>
              {migrationItems?.items
                ?.map(item => ({
                  ...item,
                  status: computeMigrationStatus(item.status)
                }))
                .map((migrationItem, index) => (
                  <TableRow key={`migration-lates-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {`${migrationItem.delegate.sourceSurname} ${migrationItem.delegate.sourceName}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(
                          `subscriptions.migration.status.${migrationItem.status.label}`
                        )}
                        color={migrationItem.status.color}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" textAlign="right">
                        {new Date(migrationItem.lastUpdate).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </LoaderSkeleton>
    </Stack>
  );
};
