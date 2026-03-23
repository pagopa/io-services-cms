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

import { LoaderSkeleton } from "../loaders";
import { TableRowMenu } from "../table-view/table-row-menu";
import { TableViewProps } from "../table-view/table-view";

const BG_COLOR = "#EEEEEE";

/** Renders a MUI `Table` for aggregated institutions with server-side pagination */
export function AggregatedInstitutionTableView<T>({
  ...props
}: TableViewProps<T>) {
  const { t } = useTranslation();
  const page = Math.floor(props.pagination.offset / props.pagination.limit);
  const rowsPerPage = props.pagination.limit;

  const handlePageChange = (_event: unknown, newPage: number) => {
    props.onPageChange(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    props.onRowsPerPageChange(+event.target.value);
  };

  const customLabelDisplayedRows = ({
    count,
    from,
    to,
  }: LabelDisplayedRowsArgs) =>
    `${from}-${to} ${t("table.pagination.labelDisplayedRows.of")} ${
      count !== -1
        ? count
        : `${t("table.pagination.labelDisplayedRows.moreThan")} ${to}`
    }`;

  return (
    <Box bgcolor={BG_COLOR} data-testid="table-view" paddingX={3} paddingY={3}>
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
              props.rows.map((item, tbRowIndex) => (
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
          count={props.pagination.count}
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
