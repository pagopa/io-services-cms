import { cleanup, render, screen } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { afterEach, describe, expect, it } from "vitest";

let emptyStateLabel = "emptyStateLabel";
let ctaLabel = "ctaLabel";
let ctaRoute = "/ctaRoute";

const getEmptyStateComponent = () => (
  <div id="es-test">
    <EmptyState
      emptyStateLabel={emptyStateLabel}
      ctaLabel={ctaLabel}
      ctaRoute={ctaRoute}
    ></EmptyState>
  </div>
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[Empty State] Component", () => {
  it("Should render the button to redirect inside the empty state if ctaLabel is set", () => {
    render(getEmptyStateComponent());
    const aButton = screen.getByRole("button", {
      name: ctaLabel
    });
    expect(aButton).toBeVisible();
  });

  it("Should NOT render a button if the button label is empty but should render the component label", () => {
    ctaLabel = "";
    ctaRoute = "";
    render(getEmptyStateComponent());
    expect(document.getElementById("es-test")).not.toContainHTML(
      '<ButtonNaked color="primary" size="medium" sx={{ verticalAlign: "unset" }}>{t(props.ctaLabel)}</ButtonNaked>'
    );
    expect(document.getElementById("es-test")).toContainHTML(
      '<p class="MuiTypography-root MuiTypography-body2 css-1ypfif-MuiTypography-root">emptyStateLabel</p>'
    );
  });
});
