/* eslint-disable max-lines-per-function */
import { ApiKeyValueAsync } from "@/components/api-keys/api-key-value-async";
import { useDialog } from "@/components/dialog-provider";
import { EmptyStateLayer } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import { InstitutionSearchByName } from "@/components/institutions";
import { buildSnackbarItem } from "@/components/notification";
import {
  TableRowMenuAction,
  TableView,
  TableViewColumn,
} from "@/components/table-view";
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
import { ReactElement, useEffect, useState } from "react";

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

const aggregatedInstitutionPlaceholder: AggregatedInstitutionListItem = {
  id: "",
  isLoading: false,
  isVisible: false,
  name: "",
};

export default function AggregatedInstitutions() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();
  const { enqueueSnackbar } = useSnackbar();

  const tableViewColumns: TableViewColumn<AggregatedInstitutionListItem>[] = [
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
  ];

  const {
    data: dipData,
    error: dipError,
    fetchData: dipFetchData,
    loading: dipLoading,
  } = useFetch<AggregatedInstitutionPagination>();
  const [aggregatedInstitutions, setAggregatedInstitutions] =
    useState<AggregatedInstitutionListItem[]>();
  const [pagination, setPagination] = useState({
    count: 0,
    limit: DEFAULT_PAGE_LIMIT,
    offset: 0,
  });
  const [noAggregatedInstitutions, setNoAggregatedInstitutions] =
    useState(false);
  const [currentSearchByInstitutionName, setCurrentSearchByInstitutionName] =
    useState<string>();

  const updateAggregatedInstitutionListItemById = (
    id: string,
    updatedItem: Partial<AggregatedInstitutionListItem>,
  ) => {
    setAggregatedInstitutions((prev) =>
      prev?.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item,
      ),
    );
  };

  const getGenericErrorNotification = () =>
    enqueueSnackbar(
      buildSnackbarItem({
        message: "",
        severity: "error",
        title: t("notifications.genericError"),
      }),
    );

  const handleRetrieveManageSubscriptionKeys = async (aggregateId: string) => {
    const response =
      await client.retrieveInstitutionAggregateManageSubscriptionsKeys({
        aggregateId,
      });

    if (E.isRight(response)) {
      const maybeValue = SubscriptionKeys.decode(response.right.value);
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
  };

  const handleRegenerateKey = async (
    subscriptionId: string,
    keyType: SubscriptionKeyTypeEnum,
  ) => {
    const response = await client.regenerateManageSubscriptionKey({
      keyType,
      subscriptionId,
    });

    if (E.isRight(response)) {
      const maybeValue = SubscriptionKeys.decode(response.right.value);
      if (E.isRight(maybeValue)) {
        enqueueSnackbar(
          buildSnackbarItem({
            message: "",
            severity: "success",
            title: t("notifications.success"),
          }),
        );
        updateAggregatedInstitutionListItemById(subscriptionId, {
          ...response.right.value,
        });
        trackEaManageKeyRegenerateEvent(subscriptionId, keyType);
      } else {
        getGenericErrorNotification();
      }
    } else {
      getGenericErrorNotification();
    }
  };

  const handlePageChange = (pageIndex: number) =>
    setPagination({
      count: pagination.count,
      limit: pagination.limit,
      offset: pagination.limit * pageIndex,
    });

  const handleRowsPerPageChange = (pageSize: number) =>
    setPagination({
      count: pagination.count,
      limit: pageSize,
      offset: 0,
    });

  /** handle actions click: open confirmation modal and on confirm click, perform bff call action */
  const handleConfirmationModal = async (options: {
    action: AggregatedInstitutionContextMenuActions;
    institutionId: string;
  }) => {
    const isConfirmed = await showDialog({
      confirmButtonLabel: t(
        `aggregated-institution.${options.action}.modal.button`,
      ),
      message: t(`aggregated-institution.${options.action}.modal.description`),
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
  };

  /** Returns a list of `TableRowMenuAction` depending on aggregated institution status */
  const getAggregatedInstitutionMenu = (
    di: AggregatedInstitutionListItem,
  ): TableRowMenuAction[] => {
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
  };

  const retrieveInstitutionAggregates = () => {
    dipFetchData(
      "retrieveInstitutionAggregates",
      {
        institutionId: session?.user?.institution.id as string,
        limit: pagination.limit,
        offset: pagination.offset,
        search: currentSearchByInstitutionName,
      },
      AggregatedInstitutionPagination,
      {
        notify: "errors",
      },
    );
  };

  const handleSearchByInstitutionNameClick = (name?: string) => {
    setPagination({
      ...pagination,
      offset: 0,
    });
    setCurrentSearchByInstitutionName(name);
  };

  const resetSearchByInstitutionName = () => {
    setCurrentSearchByInstitutionName(undefined);
  };

  // fetch services when table pagination or search by institution name change
  useEffect(() => {
    retrieveInstitutionAggregates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, currentSearchByInstitutionName]);

  // make some checks and adjustments on aggregated institutions fetch result
  useEffect(() => {
    const maybeDipData = AggregatedInstitutionPagination.decode(dipData);
    if (E.isRight(maybeDipData)) {
      // check fetch result (if no aggregated institutions, an EmptyState component will be displayed)
      if (
        maybeDipData.right.value.length === 0 &&
        !currentSearchByInstitutionName // no active search by institution name in progress
      )
        setNoAggregatedInstitutions(true);
      // check pagination data and build a full pagination.count array of aggregated institutions
      // filling empty items with some placeholders (in order to have a working paginated MUI Table)
      if (
        maybeDipData.right.pagination.offset !== undefined &&
        maybeDipData.right.pagination.limit
      ) {
        const aggregatedInstitutionsPlaceholders = Array(
          maybeDipData.right.pagination.count,
        ).fill(aggregatedInstitutionPlaceholder);
        aggregatedInstitutionsPlaceholders.splice(
          maybeDipData.right.pagination.offset,
          maybeDipData.right.value.length,
          ...maybeDipData.right.value,
        );
        setAggregatedInstitutions(aggregatedInstitutionsPlaceholders);
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
          <TableView
            columns={tableViewColumns}
            loading={dipLoading && dipError === undefined}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            pagination={pagination}
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
