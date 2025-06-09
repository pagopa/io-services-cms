import { EmptyStateLayer } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import {
  TableRowMenuAction,
  TableView,
  TableViewColumn,
} from "@/components/table-view";
import { DelegatedInstitutionPagination } from "@/generated/api/DelegatedInstitutionPagination";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { authOptions } from "@/lib/auth/auth-options";
import { Typography } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { Session, getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect, useState } from "react";

const pageTitleLocaleKey = "routes.delegated-institutions.title";
const pageDescriptionLocaleKey = "routes.delegated-institutions.description";

const DEFAULT_PAGE_LIMIT = 10;

interface DelegatedInstitutionListItem {
  id: string;
  name: string;
  primary_key?: string;
  secondary_key?: string;
}

const delegatedInstitutionPlaceholder: DelegatedInstitutionListItem = {
  id: "id",
  name: "name",
};

export default function DelegatedInstitutions() {
  const { data: session } = useSession();

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
      label: "routes.delegated-institutions.tableHeader.primaryKey",
      name: "primary_key",
    },
    {
      alignment: "left",
      label: "routes.delegated-institutions.tableHeader.secondaryKey",
      name: "secondary_key",
    },
  ];

  const {
    data: dipData,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSearchByInstitutionName, setCurrentSearchByInstitutionName] =
    useState<string>();

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

  /** Returns a list of `TableRowMenuAction` depending on delegated institution status */
  const getDelegatedInstitutionMenu = (
    _di: DelegatedInstitutionListItem,
  ): TableRowMenuAction[] => {
    const result: TableRowMenuAction[] = [];
    // TODO
    return result;
  };

  const getDelegatedInstitutions = () => {
    dipFetchData(
      "getDelegatedInstitutions",
      {
        institutionId: session?.user?.institution.id as string,
        limit: pagination.limit,
        offset: pagination.offset,
      },
      DelegatedInstitutionPagination,
      {
        notify: "errors",
      },
    );
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
        <TableView
          columns={tableViewColumns}
          loading={dipLoading}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          pagination={pagination}
          rowMenu={getDelegatedInstitutionMenu}
          rows={delegatedInstitutions}
        />
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
