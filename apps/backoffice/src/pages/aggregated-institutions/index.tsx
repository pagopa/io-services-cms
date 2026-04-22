/* eslint-disable max-lines-per-function */
import { auth } from "@/auth";
import { AggregatedInstitutionDownloadAlert } from "@/components/aggregated-institutions/aggregated-institution-download-alert";
import { AggregatedInstitutionTableView } from "@/components/aggregated-institutions/aggregated-institution-table-view";
import { AggregatedInstitutionsDialog } from "@/components/aggregated-institutions/aggregated-institutions-dialog";
import { AggregatedInstitutionsSearchBar } from "@/components/aggregated-institutions/aggregated-institutions-searchbar";
import { ApiKeyValueAsync } from "@/components/api-keys/api-key-value-async";
import { useDialog } from "@/components/dialog-provider";
import { EmptyStateLayer } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import { buildSnackbarItem } from "@/components/notification";
import { TableRowMenuAction, TableViewColumn } from "@/components/table-view";
import { AggregatedInstitutionPagination } from "@/generated/api/AggregatedInstitutionPagination";
import { AggregatedInstitutionsManageKeysLinkMetadata } from "@/generated/api/AggregatedInstitutionsManageKeysLinkMetadata";
import { AggregatedInstitutionsManageKeysPassword } from "@/generated/api/AggregatedInstitutionsManageKeysPassword";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch, { client } from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
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
import * as tt from "io-ts";
import { Session } from "next-auth";
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

  const { fetchData: fetchRequestKeys, loading: fetchingRequestKeys } =
    useFetch();
  const { data: downloadLinkData, fetchData: fetchDownloadLink } =
    useFetch<AggregatedInstitutionsManageKeysLinkMetadata>();

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
  const [isModalOpened, setIsModalOpened] = useState(false);

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

  const handleRetrieveManageSubscriptionKeys = useCallback(
    async (aggregateId: string) => {
      const maybeResponse =
        await client.retrieveInstitutionAggregateManageSubscriptionsKeys({
          aggregateId,
        });

      if (E.isRight(maybeResponse)) {
        const maybeValue = SubscriptionKeys.decode(maybeResponse.right.value);
        if (E.isRight(maybeValue)) {
          updateAggregatedInstitutionListItemById(aggregateId, {
            ...maybeValue.right,
          });
          return;
        }
      }
      getGenericErrorNotification();
      updateAggregatedInstitutionListItemById(aggregateId, {
        isVisible: true,
        primary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
        secondary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
      });
    },
    [getGenericErrorNotification, updateAggregatedInstitutionListItemById],
  );

  const handleRegenerateKey = useCallback(
    async (aggregateId: string, keyType: SubscriptionKeyTypeEnum) => {
      const maybeResponse =
        await client.regenerateInstitutionAggregateManageSubscriptionsKey({
          aggregateId,
          keyType,
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
          updateAggregatedInstitutionListItemById(aggregateId, {
            ...maybeValue.right,
          });
          trackEaManageKeyRegenerateEvent(aggregateId, keyType);
          return;
        }
      }
      getGenericErrorNotification();
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

  /** handle actions click: open confirmation modal and on confirm click, perform bff call action */
  const handleConfirmationModal = useCallback(
    async (options: {
      action: AggregatedInstitutionContextMenuActions;
      institutionId: string;
    }) => {
      const isConfirmed = await showDialog({
        confirmButtonLabel: t(
          `aggregated-institution.${options.action}.modal.button`,
        ),
        message: t(
          `aggregated-institution.${options.action}.modal.description`,
        ),
        title: t(`aggregated-institution.${options.action}.modal.title`),
      });
      if (isConfirmed) {
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

  /** Returns a list of `TableRowMenuAction` depending on aggregated institution status */
  const getAggregatedInstitutionMenu = useCallback(
    (di: AggregatedInstitutionListItem): TableRowMenuAction[] => {
      const isUserAdmin = isAdmin(session);

      const visibilityAction: TableRowMenuAction = di.isVisible
        ? {
            hasBottomDivider: isUserAdmin,
            icon: <VisibilityOff color="primary" fontSize="inherit" />,
            label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.hide}`,
            onClick: () =>
              updateAggregatedInstitutionListItemById(di.id, {
                isVisible: false,
              }),
          }
        : {
            hasBottomDivider: isUserAdmin,
            icon: <Visibility color="primary" fontSize="inherit" />,
            label: `aggregated-institution.actions.${AggregatedInstitutionContextMenuActions.show}`,
            onClick: async () => {
              if (isNullUndefinedOrEmpty(di.primary_key)) {
                updateAggregatedInstitutionListItemById(di.id, {
                  isLoading: true,
                });
                await handleRetrieveManageSubscriptionKeys(di.id);
              }
              updateAggregatedInstitutionListItemById(di.id, {
                isLoading: false,
                isVisible: true,
              });
              trackEaManageKeyShowEvent(di.id);
            },
          };

      const adminActions: TableRowMenuAction[] = isUserAdmin
        ? [
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
          ]
        : [];

      return [visibilityAction, ...adminActions];
    },
    [
      handleConfirmationModal,
      handleRetrieveManageSubscriptionKeys,
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
                  handleRetrieveManageSubscriptionKeys(di.id)
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
                  handleRetrieveManageSubscriptionKeys(di.id)
                }
              />
            </Box>
          ),
          label: "routes.aggregated-institutions.tableHeader.secondaryKey",
          name: "secondary_key",
        },
      ],
      [handleRetrieveManageSubscriptionKeys],
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

  const fetchAggregatedInstitutionsManageKeysLink = useCallback(() => {
    fetchDownloadLink(
      "getAggregatedInstitutionsManageKeysLink",
      {},
      AggregatedInstitutionsManageKeysLinkMetadata,
    );
  }, [fetchDownloadLink]);

  const handleConfirmDialog = useCallback(
    (password: AggregatedInstitutionsManageKeysPassword) =>
      fetchRequestKeys(
        "requestAggregatedInstitutionsManageKeys",
        { body: { password } },
        tt.unknown,
        { notify: "all" },
      ).then((data) => {
        if (data.success) {
          fetchAggregatedInstitutionsManageKeysLink();
        }
      }),
    [fetchRequestKeys, fetchAggregatedInstitutionsManageKeysLink],
  );

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
  }, [
    pagination,
    currentSearchByInstitutionName,
    dipFetchData,
    session?.user?.institution.id,
  ]);

  // make some checks and adjustments on aggregated institutions fetch result
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
    fetchAggregatedInstitutionsManageKeysLink();
  }, [fetchAggregatedInstitutionsManageKeysLink]);

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
          <AggregatedInstitutionDownloadAlert
            data={downloadLinkData}
            onRefresh={fetchAggregatedInstitutionsManageKeysLink}
          />
          <AggregatedInstitutionsSearchBar
            disableGenerate={downloadLinkData?.state === "IN_PROGRESS"}
            hideGenerate={Boolean(currentSearchByInstitutionName)}
            onEmptySearch={resetSearchByInstitutionName}
            onGenerateClick={() => {
              setIsModalOpened(true);
            }}
            onSearchClick={handleSearchByInstitutionNameClick}
          />
          <AggregatedInstitutionsDialog
            isDownloadReady={downloadLinkData?.state === "DONE"}
            isOpen={isModalOpened}
            onClose={() => {
              setIsModalOpened(false);
            }}
            onConfirm={handleConfirmDialog}
            sumbitting={fetchingRequestKeys}
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
  const { locale } = context;

  // Check feature flag
  if (process.env.NEXT_PUBLIC_EA_ENABLED !== "true") {
    return { notFound: true };
  }

  // Get server side session
  const session: Session | null = await auth(context);

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
