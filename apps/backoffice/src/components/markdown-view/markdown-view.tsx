import Markdown from "react-markdown";

export interface MarkdownViewProps {
  /** string value with markdown syntax to be rendered */
  children?: string;
}

/** Renders markdown syntax */
export const MarkdownView = ({ children }: MarkdownViewProps) => (
  <span data-testid="bo-io-markdown-view" style={{ fontSize: "16px" }}>
    <Markdown
      allowedElements={["p", "strong", "em", "ul", "ol", "li", "a"]}
      unwrapDisallowed
    >
      {children}
    </Markdown>
  </span>
);
