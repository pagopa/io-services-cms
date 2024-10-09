/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * MigrationManager Component
 *
 * The MigrationManager serves as the central interface for managing the migration of Azure subscriptions from individual user ownership to institutional ownership.
 * This React component is part of the Azure Apim Subscription Manager and includes both UI and logic to handle various aspects of the migration process.
 *
 * Capabilities:
 * - Displaying the current migration status of Azure subscriptions, grouped by user.
 * - Providing real-time updates on the migration progress.
 * - Allowing administrators to initiate and monitor the migration process.
 * - Facilitating the selection of delegates responsible for importing subscriptions into the institution, effectively transferring ownership from individual users to the institution.
 *
 * Usage:
 * This component is intended for use within the administrative dashboard of the Azure Apim Subscription Manager, providing administrators with the tools needed to oversee and control the subscription migration process.
 */
import { ButtonWithLoader } from "@/components/buttons";
import { CardBaseContainer } from "@/components/cards";
import { buildSnackbarItem } from "@/components/notification";
import { getConfiguration } from "@/config";
import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegate } from "@/generated/api/MigrationDelegate";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import useFetch from "@/hooks/use-fetch";
import { logToMixpanel } from "@/utils/mix-panel";
import { Upload } from "@mui/icons-material";
import { Alert, AlertTitle, Divider, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useTranslation } from "next-i18next";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

import { MigrationLatest } from ".";
import { MigrationModal } from "./migration-modal";

// migration status as it matters for this component
export type MigrationStatus = "doing" | "done" | "failed" | "todo";
export type MigrationStatusColor = "error" | "info" | "success" | "warning";
export interface MigrationChipStatus {
  color: MigrationStatusColor;
  label: MigrationStatus;
}

export interface DelegateStatusPair {
  data: MigrationData;
  delegate: MigrationDelegate;
}

/** Renders subscriptions migrator helper _(from old Deleloper Portal)_ */
export const MigrationManager = () => {
  const { t } = useTranslation();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [migrationStatusList, setMigrationStatusList] =
    useState<DelegateStatusPair[]>();

  const {
    data: migrationItemsData,
    fetchData: migrationItemsFetchData,
    loading: migrationItemsLoading,
  } = useFetch<MigrationItemList>();
  const {
    data: migrationDelegatesData,
    fetchData: migrationDelegatesFetchData,
    loading: migrationDelegatesLoading,
  } = useFetch<MigrationDelegateList>();

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    logToMixpanel("IO_BO_SERVICES_IMPORT_OPEN", "UX", {});
  };

  const getMigrationOwnershipClaimsUrl = (delegateId: string) =>
    `${
      getConfiguration().API_BACKEND_BASE_URL
    }/api/services/migrations/ownership-claims/${delegateId}`;

  // direct axios fetch
  const getDelegateMigrationStatus = async (delegateId: string) => {
    try {
      const { data, status } = await axios.get<MigrationData>(
        getMigrationOwnershipClaimsUrl(delegateId),
      );
      return { data, status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { data: error.message, status: -1 };
      } else {
        return { data: JSON.stringify(error), status: -1 };
      }
    }
  };

  // direct axios fetch
  const postDelegateMigrationOwnershipClaims = async (delegateId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      const { status } = await axios.post<void>(
        getMigrationOwnershipClaimsUrl(delegateId),
      );
      return { status };
    } catch (error) {
      return { status: -1 };
    }
  };

  const fetchDelegateStatusPairs = async () => {
    const pairs: DelegateStatusPair[] = [];
    try {
      if (migrationDelegatesData && migrationDelegatesData.delegates) {
        const promises = migrationDelegatesData.delegates.map(
          async (delegate) => {
            const result = await getDelegateMigrationStatus(delegate.sourceId);
            if (result.status === 200) {
              pairs.push({
                data: result.data,
                delegate,
              });
            }
          },
        );
        await Promise.all(promises);
        setMigrationStatusList([...pairs]);
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      setMigrationStatusList(undefined);
    }
  };

  // claim owneship for selected delegates
  const claimOwnership = async (delegates: string[]) => {
    try {
      setImportInProgress(true);
      await Promise.all(delegates.map(postDelegateMigrationOwnershipClaims));
      enqueueSnackbar(
        buildSnackbarItem({
          message: "",
          severity: "success",
          title: t("notifications.success"),
        }),
      );
      logToMixpanel("IO_BO_SERVICES_IMPORT_END", "TECH", {
        result: "success",
      });
    } catch (error) {
      enqueueSnackbar(
        buildSnackbarItem({
          message: JSON.stringify(error),
          severity: "error",
          title: t("notifications.exceptionError"),
        }),
      );
      logToMixpanel("IO_BO_SERVICES_IMPORT_END", "TECH", {
        result: error as string,
      });
    } finally {
      setImportInProgress(false);
      fetchMigrationLatestData();
    }
  };

  const fetchMigrationLatestData = () => {
    migrationItemsFetchData(
      "getServicesMigrationStatus",
      {},
      MigrationItemList,
      { notify: "errors" },
    );
  };

  // for each delegate fetch own migration status
  useEffect(() => {
    fetchDelegateStatusPairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migrationDelegatesData]);

  // When import modal is open, fetch delegate list
  useEffect(() => {
    if (isImportModalOpen) {
      migrationDelegatesFetchData(
        "getServicesMigrationDelegates",
        {},
        MigrationDelegateList,
        { notify: "errors" },
      );
    } else {
      // reset DelegateStatusPair list
      setMigrationStatusList(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImportModalOpen]);

  // Fetch "latest" import status: returns a list of delegate/status pair
  useEffect(() => {
    fetchMigrationLatestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CardBaseContainer>
      <Typography variant="h6">{t("subscriptions.migration.title")}</Typography>
      <Stack alignItems="center" direction="column" marginY={3} spacing={3}>
        <Alert severity="warning">
          <AlertTitle>
            {t("subscriptions.migration.disclaimer.title")}
          </AlertTitle>
          {t("subscriptions.migration.disclaimer.description")}
        </Alert>
        <ButtonWithLoader
          disabled={importInProgress}
          fullWidth
          label="subscriptions.migration.action"
          loading={importInProgress}
          onClick={handleOpenImportModal}
          startIcon={<Upload fontSize="inherit" />}
          sx={{ fontWeight: 700 }}
        />
        <Divider />
        <MigrationLatest
          migrationItems={migrationItemsData}
          onRefreshClick={fetchMigrationLatestData}
        />
      </Stack>
      <MigrationModal
        isOpen={isImportModalOpen}
        migrationStatusList={migrationStatusList}
        onImportClick={claimOwnership}
        onOpenChange={setIsImportModalOpen}
      />
    </CardBaseContainer>
  );
};
