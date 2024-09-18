import { SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

export * from "./button-back";
export * from "./button-cancel";
export * from "./button-exit";
export * from "./button-next";
export * from "./button-show-more";
export * from "./button-with-loader";
export * from "./button-with-tooltip";
export * from "./icon-button-close";

export interface ButtonBaseProps {
  /** If `true`, the component is disabled.
   *
   * @default false */
  disabled?: boolean;
  /** Element placed after the children. */
  endIcon?: ReactNode;
  /** Event triggered on element click */
  onClick: () => void;
  /** Element placed before the children. */
  startIcon?: ReactNode;
  /** The system prop that allows defining system overrides as well as additional CSS styles. */
  sx?: SxProps<Theme>;
}
