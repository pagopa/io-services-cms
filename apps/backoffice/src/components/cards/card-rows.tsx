import { Grid, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useTranslation } from "next-i18next";
import React, { ReactNode } from "react";

import { ApiKeyValue } from "../api-keys";
import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";
import { MarkdownView } from "../markdown-view";
import { logToMixpanel } from "@/utils/mix-panel";

export interface CardRowType {
  /** If true, a *""copy to clipboard"* icon is shown on right side of *value* */
  copyableValue?: boolean;
  /** row value kind, useful for some specific render modes */
  kind?: CardRowValueType;
  /** row label, shown on left */
  label: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   * _(This is the default behaviour)_ */
  noWrap?: boolean;
  /** if `true`, renders value on a new line _(the default behaviour renders value inline, with its label on left)_ */
  renderValueOnNewLine?: boolean;
  /** row value, shown on right */
  value?: ReactNode | string;
}

export type CardRowValueType = "apikey" | "datetime" | "link" | "markdown";

export interface CardRowsProps {
  /** Array of label/value rows displayed as a list */
  rows: CardRowType[];
}

/** Used to show general-purpose information as label/value rows. */
export const CardRows = ({ rows }: CardRowsProps) => {
  const { t } = useTranslation();

  const handleMixpanel = (label: string) => {
    if (label == "keys.primary.title") {
      logToMixpanel("IO_BO_MANAGE_KEY_COPY", {
        keyType: "primary",
        entryPoint: "Overview page"
      });
    } else if (label == "keys.secondary.title") {
      logToMixpanel("IO_BO_MANAGE_KEY_COPY", {
        keyType: "secondary",
        entryPoint: "Overview page"
      });
    }
  };

  const renderValue = (
    value: ReactNode | string | undefined,
    children: ReactNode
  ) => (
    <LoaderSkeleton loading={value === undefined} style={{ width: "100%" }}>
      {children}
    </LoaderSkeleton>
  );

  const renderTextValue = (row: CardRowType) => (
    <Typography
      color={row.kind === "link" ? "primary" : "text"}
      fontWeight={600}
      noWrap={row.noWrap ?? true}
      variant="body2"
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
        return (
          <ApiKeyValue
            handleMixpanel={() => {
              handleMixpanel(row.label as string);
            }}
            isVisible={false}
            keyValue={row.value as string}
          />
        );
      case "datetime":
        return renderValue(row.value, renderTextValue(row));
      case "link":
        return renderValue(
          row.value,
          row.value ? (
            <NextLink
              href={row.value as string}
              rel="noreferrer"
              target="_blank"
            >
              {renderTextValue(row)}
            </NextLink>
          ) : (
            renderTextValue(row)
          )
        );
      case "markdown":
        return <MarkdownView>{(row.value as string) ?? ""}</MarkdownView>;
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
          alignItems="center"
          columnSpacing={2}
          container
          key={index}
          marginTop={2}
          spacing={0}
        >
          <Grid item xs={row.renderValueOnNewLine ? 12 : 4}>
            <Typography noWrap variant="body2">
              {t(row.label)}
            </Typography>
          </Grid>
          <Grid item xs={row.renderValueOnNewLine ? 12 : 8}>
            <Stack alignItems="center" direction="row" spacing={0.5}>
              {manageRowValue(row)}
            </Stack>
          </Grid>
        </Grid>
      ))}
    </>
  );
};
