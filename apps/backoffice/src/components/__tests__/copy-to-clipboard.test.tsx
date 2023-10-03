import { afterEach, describe, expect, it, vitest } from "vitest";
import { CopyToClipboard } from "../copy-to-clipboard";
import { cleanup, fireEvent, render } from "@testing-library/react";

let textToCopy = "textToCopy";
const getCopyToClipboardComponent = () => (
  <CopyToClipboard text={textToCopy}></CopyToClipboard>
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[CopyToClipboard] Component", () => {
  it("should copy to clipboard", () => {
    const { getByRole } = render(getCopyToClipboardComponent());

    Object.assign(window.navigator, {
      clipboard: {
        writeText: vitest.fn().mockImplementation(() => Promise.resolve())
      }
    });

    const button = getByRole("button");
    fireEvent.click(button);

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      textToCopy
    );
  });
});
