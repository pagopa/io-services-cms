import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow
} from "@mui/material";
import { ReactElement, useState } from "react";
import { TableRowMenu, TableRowMenuAction } from "./table-row-menu";

const BG_COLOR = "#EEEEEE";

/** Describe a column _(layout and content)_ of `<TableView/>` component */
export type TableViewColumn<T> = {
  /** table header text */
  label: string;
  /** property of **T** type object that will be displayed */
  name: keyof T;
  /** column text alignment */
  alignment: "left" | "center" | "right";
  /** if specified, uses the custom component defined for displaying a value of the T-type object */
  cellTemplate?: (value: T) => ReactElement;
};

export type TableViewPagination = {
  offset: number;
  limit: number;
  count: number;
};

export type TableViewProps<T> = {
  /** describe the list of columns to be displayed */
  columns: TableViewColumn<T>[];
  /** table data source of T-type objects */
  rows: T[];
  /** given the T-type object relating to a table row, it defines the menu of the row itself \
   * _(shown at the end of the row with the symbol of the 3 dots aligned vertically)_ */
  rowMenu: (value: T) => TableRowMenuAction[];
  /** define the page offset, limit and total count for `TablePagination` component at the bottom of `Table` */
  pagination: TableViewPagination;
  /** if true, shows a loading circle state in `Table` body */
  loading?: boolean;
};

/** Renders a a MUI `Table` with some customizable properties */
export function TableView<T>({ ...props }: TableViewProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(props.pagination.limit);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box paddingX={3} paddingY={3} bgcolor={BG_COLOR}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="table-view" size="small">
          <TableHead style={{ backgroundColor: BG_COLOR }}>
            <TableRow>
              {props.columns.map((col, thColIndex) => (
                <TableCell key={`th-col-${thColIndex}`} align={col.alignment}>
                  {col.label}
                </TableCell>
              ))}
              <TableCell align="right"> </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.rows && !props.loading ? (
              props.rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, tbRowIndex) => (
                  <TableRow
                    key={`tb-row-${tbRowIndex}`}
                    sx={{
                      "&:last-child td, &:last-child th": {
                        border: 0
                      }
                    }}
                  >
                    {props.columns.map((col, tbColIndex) => (
                      <TableCell
                        key={`tb-row-${tbRowIndex}-col-${tbColIndex}`}
                        align={col.alignment}
                      >
                        {col.cellTemplate
                          ? col.cellTemplate(item)
                          : (item[col.name as keyof typeof item] as string)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <TableRowMenu actions={props.rowMenu(item)} />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  sx={{ padding: 5 }}
                  align="center"
                  colSpan={props.columns.length + 1}
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
          sx={{ bgcolor: "background.paper" }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={props.rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          showFirstButton
          showLastButton
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      ) : null}
    </Box>
  );
}
