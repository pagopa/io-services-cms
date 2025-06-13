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
import { DelegatedInstitutionPagination } from "@/generated/api/DelegatedInstitutionPagination";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch, { client } from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { authOptions } from "@/lib/auth/auth-options";
import { isAdmin } from "@/utils/auth-util";
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

const pageTitleLocaleKey = "routes.delegated-institutions.title";
const pageDescriptionLocaleKey = "routes.delegated-institutions.description";

const DEFAULT_PAGE_LIMIT = 10;

export enum DelegatedInstitutionContextMenuActions {
  hide = "hide",
  regeneratePk = "regeneratePk",
  regenerateSk = "regenerateSk",
  show = "show",
}

interface DelegatedInstitutionListItem {
  id: string;
  isLoading: boolean;
  isVisible: boolean;
  name: string;
  primary_key?: string;
  secondary_key?: string;
}

const delegatedInstitutionPlaceholder: DelegatedInstitutionListItem = {
  id: "",
  isLoading: false,
  isVisible: false,
  name: "",
};

export default function DelegatedInstitutions() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();
  const { enqueueSnackbar } = useSnackbar();

  const tableViewColumns: TableViewColumn<DelegatedInstitutionListItem>[] = [
    {
      alignment: "left",
      cellTemplate: (di) => (
        <Typography fontWeight={600} variant="body2">
          {di.name}
        </Typography>
      ),
      label: "routes.delegated-institutions.tableHeader.name",
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
            onRequestCopyToClipboard={() =>
              handleGetManageSubscriptionKeys(di.id)
            }
          />
        </Box>
      ),
      label: "routes.delegated-institutions.tableHeader.primaryKey",
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
            onRequestCopyToClipboard={() =>
              handleGetManageSubscriptionKeys(di.id)
            }
          />
        </Box>
      ),
      label: "routes.delegated-institutions.tableHeader.secondaryKey",
      name: "secondary_key",
    },
  ];

  const {
    data: dipData,
    error: dipError,
    fetchData: dipFetchData,
    loading: dipLoading,
  } = useFetch<DelegatedInstitutionPagination>();
  const [delegatedInstitutions, setDelegatedInstitutions] =
    useState<DelegatedInstitutionListItem[]>();
  const [pagination, setPagination] = useState({
    count: 0,
    limit: DEFAULT_PAGE_LIMIT,
    offset: 0,
  });
  const [noDelegatedInstitutions, setNoDelegatedInstitutions] = useState(false);
  const [currentSearchByInstitutionName, setCurrentSearchByInstitutionName] =
    useState<string>();

  const updateDelegatedInstitutionListItemById = (
    id: string,
    updatedItem: Partial<DelegatedInstitutionListItem>,
  ) => {
    setDelegatedInstitutions((prev) =>
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

  const handleGetManageSubscriptionKeys = async (subscriptionId: string) => {
    const maybeResponse = await client.getManageSubscriptionKeys({
      subscriptionId,
    });
    if (E.isRight(maybeResponse)) {
      updateDelegatedInstitutionListItemById(subscriptionId, {
        ...maybeResponse.right.value,
      });
    } else {
      getGenericErrorNotification();
      updateDelegatedInstitutionListItemById(subscriptionId, {
        isVisible: true,
        primary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
        secondary_key: INVALID_API_KEY_VALUE_PLACEHOLDER,
      });
    }
  };

  const handleRegenerateKey = async (
    subscriptionId: string,
    keyType: SubscriptionKeyTypeEnum,
  ) => {
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
        updateDelegatedInstitutionListItemById(subscriptionId, {
          ...maybeResponse.right.value,
        });
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
    action: DelegatedInstitutionContextMenuActions;
    institutionId: string;
  }) => {
    const raiseClickEvent = await showDialog({
      confirmButtonLabel: t(
        `delegated-institution.${options.action}.modal.button`,
      ),
      message: t(`delegated-institution.${options.action}.modal.description`),
      title: t(`delegated-institution.${options.action}.modal.title`),
    });
    if (raiseClickEvent) {
      switch (options.action) {
        case DelegatedInstitutionContextMenuActions.regeneratePk:
          await handleRegenerateKey(
            options.institutionId,
            SubscriptionKeyTypeEnum.primary,
          );
          break;
        case DelegatedInstitutionContextMenuActions.regenerateSk:
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

  /** Returns a list of `TableRowMenuAction` depending on delegated institution status */
  const getDelegatedInstitutionMenu = (
    di: DelegatedInstitutionListItem,
  ): TableRowMenuAction[] => {
    const result: TableRowMenuAction[] = [];

    if (di.isVisible) {
      result.push({
        hasBottomDivider: isAdmin(session),
        icon: <VisibilityOff color="primary" fontSize="inherit" />,
        label: `delegated-institution.actions.${DelegatedInstitutionContextMenuActions.hide}`,
        onClick: () =>
          updateDelegatedInstitutionListItemById(di.id, {
            isVisible: false,
          }),
      });
    } else {
      result.push({
        hasBottomDivider: isAdmin(session),
        icon: <Visibility color="primary" fontSize="inherit" />,
        label: `delegated-institution.actions.${DelegatedInstitutionContextMenuActions.show}`,
        onClick: async () => {
          if (isNullUndefinedOrEmpty(di.primary_key)) {
            updateDelegatedInstitutionListItemById(di.id, {
              isLoading: true,
            });
            await handleGetManageSubscriptionKeys(di.id);
          }
          updateDelegatedInstitutionListItemById(di.id, {
            isLoading: false,
            isVisible: true,
          });
        },
      });
    }

    if (isAdmin(session)) {
      result.push(
        {
          icon: <Sync color="primary" fontSize="inherit" />,
          label: `delegated-institution.actions.${DelegatedInstitutionContextMenuActions.regeneratePk}`,
          onClick: () =>
            handleConfirmationModal({
              action: DelegatedInstitutionContextMenuActions.regeneratePk,
              institutionId: di.id,
            }),
        },
        {
          icon: <Sync color="primary" fontSize="inherit" />,
          label: `delegated-institution.actions.${DelegatedInstitutionContextMenuActions.regenerateSk}`,
          onClick: () =>
            handleConfirmationModal({
              action: DelegatedInstitutionContextMenuActions.regenerateSk,
              institutionId: di.id,
            }),
        },
      );
    }

    return result;
  };

  const getDelegatedInstitutions = () => {
    dipFetchData(
      "getDelegatedInstitutions",
      {
        institutionId: session?.user?.institution.id as string,
        limit: pagination.limit,
        offset: pagination.offset,
        search: currentSearchByInstitutionName,
      },
      DelegatedInstitutionPagination,
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
    getDelegatedInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, currentSearchByInstitutionName]);

  // make some checks and adjustments on delegated institutions fetch result
  useEffect(() => {
    const maybeDipData = DelegatedInstitutionPagination.decode(dipData);
    if (E.isRight(maybeDipData)) {
      // check fetch result (if no delegated institutions, an EmptyState component will be displayed)
      if (
        maybeDipData.right.value.length === 0 &&
        !currentSearchByInstitutionName // no active search by institution name in progress
      )
        setNoDelegatedInstitutions(true);
      // check pagination data and build a full pagination.count array of delegated institutions
      // filling empty items with some placeholders (in order to have a working paginated MUI Table)
      if (
        maybeDipData.right.pagination.offset !== undefined &&
        maybeDipData.right.pagination.limit
      ) {
        const delegatedInstitutionsPlaceholders = Array(
          maybeDipData.right.pagination.count,
        ).fill(delegatedInstitutionPlaceholder);
        delegatedInstitutionsPlaceholders.splice(
          maybeDipData.right.pagination.offset,
          maybeDipData.right.value.length,
          ...maybeDipData.right.value,
        );
        setDelegatedInstitutions(delegatedInstitutionsPlaceholders);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dipData]);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      {noDelegatedInstitutions ? (
        <EmptyStateLayer
          ctaLabel=""
          ctaRoute=""
          emptyStateLabel="routes.delegated-institutions.empty"
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
            rowMenu={getDelegatedInstitutionMenu}
            rows={delegatedInstitutions ?? (dipError ? [] : undefined)}
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

DelegatedInstitutions.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
