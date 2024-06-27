import { SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

export * from "./button-back";
export * from "./button-cancel";
export * from "./button-exit";
export * from "./button-next";
export * from "./button-show-more";
export * from "./button-with-loader";
export * from "./button-with-tooltip";

export type ButtonBaseProps = {
  /** The system prop that allows defining system overrides as well as additional CSS styles. */
  sx?: SxProps<Theme>;
  /** Element placed before the children. */
  startIcon?: ReactNode;
  /** Element placed after the children. */
  endIcon?: ReactNode;
  /** If `true`, the component is disabled.
   *
   * @default false */
  disabled?: boolean;
  /** Event triggered on element click */
  onClick: () => void;
};
