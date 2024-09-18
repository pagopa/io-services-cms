import {
  Box,
  CircularProgress,
  LabelDisplayedRowsArgs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactElement, useEffect, useState } from "react";

import { LoaderSkeleton } from "../loaders";
import { TableRowMenu, TableRowMenuAction } from "./table-row-menu";

const BG_COLOR = "#EEEEEE";

/** Describe a column _(layout and content)_ of `<TableView/>` component */
export interface TableViewColumn<T> {
  /** column text alignment */
  alignment: "center" | "left" | "right";
  /** if specified, uses the custom component defined for displaying a value of the T-type object */
  cellTemplate?: (value: T) => ReactElement;
  /** table header text */
  label: string;
  /** property of **T** type object that will be displayed */
  name: keyof T;
}

export interface TableViewPagination {
  count: number;
  limit: number;
  offset: number;
}

export interface TableViewProps<T> {
  /** describe the list of columns to be displayed */
  columns: TableViewColumn<T>[];
  /** if true, shows a loading circle state in `Table` body */
  loading?: boolean;
  /** Callback fired when the page is changed. */
  onPageChange: (pageIndex: number) => void;
  /** Callback fired when the number of rows per page is changed. */
  onRowsPerPageChange: (pageSize: number) => void;
  /** define the page offset, limit and total count for `TablePagination` component at the bottom of `Table` */
  pagination: TableViewPagination;
  /** given the T-type object relating to a table row, it defines the menu of the row itself \
   * _(shown at the end of the row with the symbol of the 3 dots aligned vertically)_ */
  rowMenu: (value: T) => TableRowMenuAction[];
  /** table data source of T-type objects */
  rows?: T[];
}

/** Renders a a MUI `Table` with some customizable properties */
export function TableView<T>({ ...props }: TableViewProps<T>) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(props.pagination.limit);

  const handlePageChange = (_event: unknown, newPage: number) => {
    props.onPageChange(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
    props.onRowsPerPageChange(+event.target.value);
  };

  /**
   * TablePagination API
   * https://mui.com/material-ui/api/table-pagination/#TablePagination-prop-labelDisplayedRows
   * @param param0 `LabelDisplayedRowsArgs`
   * @returns
   */
  const customLabelDisplayedRows = ({
    count,
    from,
    to,
  }: LabelDisplayedRowsArgs) =>
    `${from}–${to} ${t("table.pagination.labelDisplayedRows.of")} ${
      count !== -1
        ? count
        : `${t("table.pagination.labelDisplayedRows.moreThan")} ${to}`
    }`;

  useEffect(() => {
    setRowsPerPage(props.pagination.limit);
    setPage(Math.floor(props.pagination.offset / props.pagination.limit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pagination]);

  return (
    <Box bgcolor={BG_COLOR} paddingX={3} paddingY={3}>
      <TableContainer component={Paper}>
        <Table aria-label="table-view" size="small" sx={{ minWidth: 650 }}>
          <TableHead style={{ backgroundColor: BG_COLOR }}>
            <TableRow>
              {props.columns.map((col, thColIndex) => (
                <TableCell align={col.alignment} key={`th-col-${thColIndex}`}>
                  {t(col.label)}
                </TableCell>
              ))}
              <TableCell align="right"> </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.rows ? (
              props.rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, tbRowIndex) => (
                  <TableRow
                    key={`tb-row-${tbRowIndex}`}
                    sx={{
                      "&:hover": { backgroundColor: "action.hover" },
                      "&:last-child td, &:last-child th": {
                        border: 0,
                      },
                    }}
                  >
                    {props.columns.map((col, tbColIndex) => (
                      <TableCell
                        align={col.alignment}
                        key={`tb-row-${tbRowIndex}-col-${tbColIndex}`}
                      >
                        <LoaderSkeleton
                          loading={props.loading ?? false}
                          style={{ width: "100%" }}
                        >
                          {col.cellTemplate
                            ? col.cellTemplate(item)
                            : (item[col.name as keyof typeof item] as string)}
                        </LoaderSkeleton>
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <LoaderSkeleton loading={props.loading ?? false}>
                        <TableRowMenu actions={props.rowMenu(item)} />
                      </LoaderSkeleton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={props.columns.length + 1}
                  sx={{ padding: 5 }}
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {props.rows ? (
        <TablePagination
          component="div"
          count={props.rows.length}
          labelDisplayedRows={customLabelDisplayedRows}
          labelRowsPerPage={t("table.pagination.labelRowsPerPage")}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          showFirstButton
          showLastButton
          sx={{ bgcolor: "background.paper" }}
        />
      ) : null}
    </Box>
  );
}
