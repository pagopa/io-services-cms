import Markdown from "react-markdown";

export type MarkdownViewProps = {
  /** string value with markdown syntax to be rendered */
  children?: string;
};

/** Renders markdown syntax */
export const MarkdownView = ({ children }: MarkdownViewProps) => {
  return (
    <span style={{ fontSize: "16px" }}>
      <Markdown
        unwrapDisallowed
        allowedElements={["p", "strong", "em", "ul", "ol", "li", "a"]}
      >
        {children}
      </Markdown>
    </span>
  );
};
