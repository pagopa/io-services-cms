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
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";

import { MigrationChipStatus } from ".";

export interface MigrationLatestProps {
  migrationItems?: MigrationItemList;
  onRefreshClick: () => void;
}

/** Render subscriptions migration latest summary status */
export const MigrationLatest = ({
  migrationItems,
  onRefreshClick,
}: MigrationLatestProps) => {
  const { t } = useTranslation();
  const isEmptyState = migrationItems?.items?.length === 0;

  // the full migration status report is reduced so that it's ready to be rendered
  const computeMigrationStatus = (
    status: MigrationItemStatus,
  ): MigrationChipStatus =>
    // at least one failed mean the overall process failed
    status.failed > 0
      ? { color: "error", label: "failed" }
      : // at least one still processing means the overall process still processing
        status.processing > 0
        ? { color: "warning", label: "doing" }
        : // for every other case, we consider it done
          { color: "success", label: "done" };
  return (
    <Stack direction="column" display="contents" spacing={3}>
      <Box>
        <Typography variant="overline">
          {t("subscriptions.migration.status.title")}
        </Typography>
        <Typography variant="body2">
          {t("subscriptions.migration.status.description")}
        </Typography>
        <Button
          onClick={onRefreshClick}
          size="small"
          startIcon={<Refresh />}
          sx={{ marginTop: 1 }}
          variant="naked"
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
        style={{ height: "50px", width: "100%" }}
      >
        <TableContainer>
          <Table size="small">
            <TableBody>
              {migrationItems?.items
                ?.map((item) => ({
                  ...item,
                  status: computeMigrationStatus(item.status),
                }))
                .map((migrationItem, index) => (
                  <TableRow hover key={`migration-lates-${index}`}>
                    <TableCell>
                      <Typography variant="body2">
                        {`${migrationItem.delegate.sourceSurname} ${migrationItem.delegate.sourceName}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={migrationItem.status.color}
                        label={t(
                          `subscriptions.migration.status.${migrationItem.status.label}`,
                        )}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="right" variant="body2">
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
