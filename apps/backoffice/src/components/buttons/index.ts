export * from "./button-back";
export * from "./button-cancel";
export * from "./button-create-draft";
export * from "./button-next";
export * from "./button-show-more";

export type ButtonBaseProps = {
  disabled?: boolean;
  onClick: () => void;
};
