import { Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import { ReactNode } from "react";
import { ApiKeyValue } from "../api-keys";
import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";
import React from "react";

export type CardRowType = {
  /** row label, shown on left */
  label: string;
  /** row value, shown on right */
  value?: string | ReactNode;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   * _(This is the default behaviour)_ */
  noWrap?: boolean;
  /** If true, a *""copy to clipboard"* icon is shown on right side of *value* */
  copyableValue?: boolean;
  /** row value kind, useful for some specific render modes */
  kind?: CardRowValueType;
};

export type CardRowValueType = "apikey" | "datetime" | "link" | "markdown";

export type CardRowsProps = {
  /** Array of label/value rows displayed as a list */
  rows: CardRowType[];
};

/** Used to show general-purpose information as label/value rows. */
export const CardRows = ({ rows }: CardRowsProps) => {
  const { t } = useTranslation();

  const renderValue = (
    value: string | ReactNode | undefined,
    children: ReactNode
  ) => (
    <LoaderSkeleton loading={value === undefined} style={{ width: "100%" }}>
      {children}
    </LoaderSkeleton>
  );

  const renderTextValue = (row: CardRowType) => (
    <Typography
      variant="body2"
      fontWeight={600}
      noWrap={row.noWrap ?? true}
      color={row.kind === "link" ? "primary" : "text"}
    >
      {row.value
        ? row.kind === "datetime"
          ? new Date(row.value as string).toLocaleString()
          : row.value
        : "-"}
    </Typography>
  );

  const manageRowValue = (row: CardRowType) => {
    if (typeof row.value === "string" || row.value === undefined) {
      return renderRowKind(row);
    } else if (React.isValidElement(row.value)) {
      return row.value;
    } else {
      console.error("Unmanaged row.value ", row.value);
    }
  };

  /** render row value based on `kind` first and other additional settings _(noWrap)_ */
  const renderRowKind = (row: CardRowType) => {
    switch (row.kind) {
      case "apikey":
        return <ApiKeyValue isVisible={false} keyValue={row.value as string} />;
      case "datetime":
        return renderValue(row.value, renderTextValue(row));
      case "link":
        return renderValue(
          row.value,
          <NextLink
            href={(row.value as string) ?? "/"}
            target="_blank"
            rel="noreferrer"
          >
            {renderTextValue(row)}
          </NextLink>
        );
      case "markdown":
        // todo: to be implemented
        return <span>{row.value}</span>;
      default:
        return renderValue(
          row.value,
          <>
            {renderTextValue(row)}
            {row.copyableValue ? (
              <CopyToClipboard text={(row.value as string) ?? ""} />
            ) : null}
          </>
        );
    }
  };

  return (
    <>
      {rows.map((row, index) => (
        <Grid
          container
          key={index}
          spacing={0}
          columnSpacing={2}
          marginTop={2}
          alignItems="center"
        >
          <Grid item xs={4}>
            <Typography variant="body2" noWrap>
              {t(row.label)}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {manageRowValue(row)}
            </Stack>
          </Grid>
        </Grid>
      ))}
    </>
  );
};
