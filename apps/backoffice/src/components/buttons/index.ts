export * from "./button-back";
export * from "./button-cancel";
export * from "./button-next";
export * from "./button-show-more";
export * from "./button-with-loader";

export type ButtonBaseProps = {
  disabled?: boolean;
  onClick: () => void;
};
