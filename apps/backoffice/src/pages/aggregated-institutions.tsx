/* eslint-disable max-lines-per-function */
import { AggregatedInstitutionTableView } from "@/components/aggregated-institution-table-view";
import { ApiKeyValueAsync } from "@/components/api-keys/api-key-value-async";
import { useDialog } from "@/components/dialog-provider";
import { EmptyStateLayer } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import { InstitutionSearchByName } from "@/components/institutions";
import { buildSnackbarItem } from "@/components/notification";
import { TableRowMenuAction, TableViewColumn } from "@/components/table-view";
import { AggregatedInstitutionPagination } from "@/generated/api/AggregatedInstitutionPagination";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch, { client } from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { authOptions } from "@/lib/auth/auth-options";
import { isAdmin } from "@/utils/auth-util";
import {
  trackAggregatedInstitutionsPageEvent,
  trackEaManageKeyCopyEvent,
  trackEaManageKeyRegenerateEvent,
  trackEaManageKeyShowEvent,
} from "@/utils/mix-panel";
import {
  INVALID_API_KEY_VALUE_PLACEHOLDER,
  isNullUndefinedOrEmpty,
} from "@/utils/string-util";
import { Sync, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { Session, getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSnackbar } from "notistack";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";

const pageTitleLocaleKey = "routes.aggregated-institutions.title";
const pageDescriptionLocaleKey = "routes.aggregated-institutions.description";

const DEFAULT_PAGE_LIMIT = 10;

export enum AggregatedInstitutionContextMenuActions {
  hide = "hide",
  regeneratePk = "regeneratePk",
  regenerateSk = "regenerateSk",
  show = "show",
}

interface AggregatedInstitutionListItem {
  id: string;
  isLoading: boolean;
  isVisible: boolean;
  name: string;
  primary_key?: string;
  secondary_key?: string;
}

export default function AggregatedInstitutions() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: dipData,
    error: dipError,
    fetchData: dipFetchData,
    loading: dipLoading,
  } = useFetch<AggregatedInstitutionPagination>();

  const [aggregatedInstitutions, setAggregatedInstitutions] =
    useState<AggregatedInstitutionListItem[]>();
  const [pagination, setPagination] = useState({
    limit: DEFAULT_PAGE_LIMIT,
    offset: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [noAggregatedInstitutions, setNoAggregatedInstitutions] =
    useState(false);
  const [currentSearchByInstitutionName, setCurrentSearchByInstitutionName] =
    useState<string>();

  const updateAggregatedInstitutionListItemById = useCallback(
    (id: string, updatedItem: Partial<AggregatedInstitutionListItem>) => {
      setAggregatedInstitutions((prev) =>
        prev?.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item,
        ),
      );
    },
    [],
  );

  const getGenericErrorNotification = useCallback(
    () =>
      enqueueSnackbar(
        buildSnackbarItem({
          message: "",
          severity: "error",
          title: t("notifications.genericError"),
        }),
      ),
    [enqueueSnackbar, t],
  );

  const handleGetManageSubscriptionKeys = useCallback(
    async (subscriptionId: string) => {
      const maybeResponse = await client.getManageSubscriptionKeys({
        subscriptionId,
      });
      if (E.isRight(maybeResponse)) {
        updateAggregatedInstitutionListItemById(subscriptionId, {
          ...maybeResponse.right.value,
        });
      } else {
        getGenericErrorNotification();
        updateAggregatedInstitutionListItemById(subscriptionId, {
          isVisible: true,
          primary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
          secondary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
        });
      }
    },
    [getGenericErrorNotification, updateAggregatedInstitutionListItemById],
  );

  const handleRegenerateKey = useCallback(
    async (subscriptionId: string, keyType: SubscriptionKeyTypeEnum) => {
      const maybeResponse = await client.regenerateManageSubscriptionKey({
        keyType,
        subscriptionId,
      });
      if (E.isRight(maybeResponse)) {
        const maybeValue = SubscriptionKeys.decode(maybeResponse.right.value);
        if (E.isRight(maybeValue)) {
          enqueueSnackbar(
            buildSnackbarItem({
              message: "",
              severity: "success",
              title: t("notifications.success"),
            }),
          );
          updateAggregatedInstitutionListItemById(subscriptionId, {
            ...maybeResponse.right.value,
          });
          trackEaManageKeyRegenerateEvent(subscriptionId, keyType);
        } else {
          getGenericErrorNotification();
        }
      } else {
        getGenericErrorNotification();
      }
    },
    [
      enqueueSnackbar,
      getGenericErrorNotification,
      t,
      updateAggregatedInstitutionListItemById,
    ],
  );

  const handlePageChange = useCallback(
    (pageIndex: number) =>
      setPagination((prev) => ({
        limit: prev.limit,
        offset: prev.limit * pageIndex,
      })),
    [],
  );

  const handleRowsPerPageChange = useCallback(
    (pageSize: number) => setPagination({ limit: pageSize, offset: 0 }),
    [],
  );

  const handleConfirmationModal = useCallback(
    async (options: {
      action: AggregatedInstitutionContextMenuActions;
      institutionId: string;
    }) => {
      const raiseClickEvent = await showDialog({
        confirmButtonLabel: t(
          `aggregated-institution.${options.action}.modal.button`,
        ),
        message: t(
          `aggregated-institution.${options.action}.modal.description`,
        ),
        title: t(`aggregated-institution.${options.action}.modal.title`),
      });
      if (raiseClickEvent) {
        switch (options.action) {
          case AggregatedInstitutionContextMenuActions.regeneratePk:
            await handleRegenerateKey(
              options.institutionId,
              SubscriptionKeyTypeEnum.primary,
            );
            break;
          case AggregatedInstitutionContextMenuActions.regenerateSk:
            await handleRegenerateKey(
              options.institutionId,
              SubscriptionKeyTypeEnum.secondary,
            );
            break;
          default:
            console.warn("unhandled action " + options.action);
            break;
        }
      }
    },
    [handleRegenerateKey, showDialog, t],
  );

  const getAggregatedInstitutionMenu = useCallback(
    (di: AggregatedInstitutionListItem): TableRowMenuAction[] => {
      const result: TableRowMenuAction[] = [];

      if (di.isVisible) {
        result.push({
          hasBottomDivider: isAdmin(session),
          icon: <VisibilityOff color="primary" fontSize="inherit" />,
          label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.hide}`,
          onClick: () =>
            updateAggregatedInstitutionListItemById(di.id, {
              isVisible: false,
            }),
        });
      } else {
        result.push({
          hasBottomDivider: isAdmin(session),
          icon: <Visibility color="primary" fontSize="inherit" />,
          label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.show}`,
          onClick: async () => {
            if (isNullUndefinedOrEmpty(di.primary_key)) {
              updateAggregatedInstitutionListItemById(di.id, {
                isLoading: true,
              });
              await handleGetManageSubscriptionKeys(di.id);
            }
            updateAggregatedInstitutionListItemById(di.id, {
              isLoading: false,
              isVisible: true,
            });
            trackEaManageKeyShowEvent(di.id);
          },
        });
      }

      if (isAdmin(session)) {
        result.push(
          {
            icon: <Sync color="primary" fontSize="inherit" />,
            label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.regeneratePk}`,
            onClick: () =>
              handleConfirmationModal({
                action: AggregatedInstitutionContextMenuActions.regeneratePk,
                institutionId: di.id,
              }),
          },
          {
            icon: <Sync color="primary" fontSize="inherit" />,
            label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.regenerateSk}`,
            onClick: () =>
              handleConfirmationModal({
                action: AggregatedInstitutionContextMenuActions.regenerateSk,
                institutionId: di.id,
              }),
          },
        );
      }

      return result;
    },
    [
      handleConfirmationModal,
      handleGetManageSubscriptionKeys,
      session,
      updateAggregatedInstitutionListItemById,
    ],
  );

  const tableViewColumns: TableViewColumn<AggregatedInstitutionListItem>[] =
    useMemo(
      () => [
        {
          alignment: "left",
          cellTemplate: (di) => (
            <Typography fontWeight={600} variant="body2">
              {di.name}
            </Typography>
          ),
          label: "routes.aggregated-institutions.tableHeader.name",
          name: "name",
        },
        {
          alignment: "left",
          cellTemplate: (di) => (
            <Box display="inline-flex">
              <ApiKeyValueAsync
                isLoading={di.isLoading}
                isVisible={di.isVisible}
                keyValue={di.primary_key}
                onCopyToClipboardClick={() =>
                  trackEaManageKeyCopyEvent(di.id, "primary")
                }
                onRequestCopyToClipboard={() =>
                  handleGetManageSubscriptionKeys(di.id)
                }
              />
            </Box>
          ),
          label: "routes.aggregated-institutions.tableHeader.primaryKey",
          name: "primary_key",
        },
        {
          alignment: "left",
          cellTemplate: (di) => (
            <Box display="inline-flex">
              <ApiKeyValueAsync
                isLoading={di.isLoading}
                isVisible={di.isVisible}
                keyValue={di.secondary_key}
                onCopyToClipboardClick={() =>
                  trackEaManageKeyCopyEvent(di.id, "secondary")
                }
                onRequestCopyToClipboard={() =>
                  handleGetManageSubscriptionKeys(di.id)
                }
              />
            </Box>
          ),
          label: "routes.aggregated-institutions.tableHeader.secondaryKey",
          name: "secondary_key",
        },
      ],
      [handleGetManageSubscriptionKeys],
    );

  const tablePagination = useMemo(
    () => ({ ...pagination, count: totalCount }),
    [pagination, totalCount],
  );

  const handleSearchByInstitutionNameClick = useCallback((name?: string) => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setCurrentSearchByInstitutionName(name);
  }, []);

  const resetSearchByInstitutionName = useCallback(() => {
    setCurrentSearchByInstitutionName(undefined);
  }, []);

  // Fetch when pagination or search changes
  useEffect(() => {
    dipFetchData(
      "retrieveInstitutionAggregates",
      {
        institutionId: session?.user?.institution.id as string,
        limit: pagination.limit,
        offset: pagination.offset,
        search: currentSearchByInstitutionName,
      },
      AggregatedInstitutionPagination,
      { notify: "errors" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, currentSearchByInstitutionName]);

  // Process fetch results
  useEffect(() => {
    const maybeDipData = AggregatedInstitutionPagination.decode(dipData);
    if (E.isRight(maybeDipData)) {
      if (
        maybeDipData.right.value.length === 0 &&
        !currentSearchByInstitutionName
      )
        setNoAggregatedInstitutions(true);
      if (
        maybeDipData.right.pagination.offset !== undefined &&
        maybeDipData.right.pagination.limit
      ) {
        setAggregatedInstitutions(
          maybeDipData.right.value.map((item) => ({
            ...item,
            isLoading: false,
            isVisible: false,
          })),
        );
        setTotalCount(maybeDipData.right.pagination.count);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dipData]);

  useEffect(() => {
    trackAggregatedInstitutionsPageEvent();
  }, []);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      {noAggregatedInstitutions ? (
        <EmptyStateLayer
          ctaLabel=""
          ctaRoute=""
          emptyStateLabel="routes.aggregated-institutions.empty"
        />
      ) : (
        <>
          <InstitutionSearchByName
            onEmptySearch={resetSearchByInstitutionName}
            onSearchClick={handleSearchByInstitutionNameClick}
          />
          <AggregatedInstitutionTableView
            columns={tableViewColumns}
            loading={dipLoading && dipError === undefined}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            pagination={tablePagination}
            rowMenu={getAggregatedInstitutionMenu}
            rows={aggregatedInstitutions ?? (dipError ? [] : undefined)}
          />
        </>
      )}
    </>
  );
}

export async function getServerSideProps(context: any) {
  const { locale, req, res } = context;

  // Check feature flag
  if (process.env.NEXT_PUBLIC_EA_ENABLED !== "true") {
    return { notFound: true };
  }

  // Get server side session
  const session: Session | null = await getServerSession(req, res, authOptions);

  // Check isAggregator session flag
  if (!session?.user?.institution.isAggregator) {
    return { notFound: true };
  }

  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

AggregatedInstitutions.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
