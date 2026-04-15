/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AggregatedInstitutionsDialog } from "../../components/aggregated-institutions/aggregated-institutions-dialog";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("[AggregatedInstitutionsDialog] Component", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    props?: Partial<React.ComponentProps<typeof AggregatedInstitutionsDialog>>,
  ) =>
    render(
      <AggregatedInstitutionsDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />,
    );

  it("should render dialog content with default info message", () => {
    renderComponent();

    expect(
      screen.getByText("routes.aggregated-institutions.exportDialog.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.description",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.rules.uppercase",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.rules.number",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.info.fileNotAvailable",
      ),
    ).toBeInTheDocument();
  });

  it("should render the overwrite info when a download is already available", () => {
    renderComponent({ isDownloadReady: true });

    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.info.fileAvailable",
      ),
    ).toBeInTheDocument();
  });

  it("should validate empty fields and mismatching passwords", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    expect(
      await screen.findByText(
        "routes.aggregated-institutions.exportDialog.fields.errors.emptyPassword",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.exportDialog.fields.errors.emptyConfirmPassword",
      ),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.newPassword",
      ),
      { target: { value: "ValidPassword1" } },
    );
    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
      ),
      { target: { value: "AnotherPassword1" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    expect(
      await screen.findByText(
        "routes.aggregated-institutions.exportDialog.fields.errors.passwordDontMatch",
      ),
    ).toBeInTheDocument();
  });

  it("should validate password security rules", async () => {
    renderComponent();

    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.newPassword",
      ),
      { target: { value: "lowercaseonly" } },
    );
    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
      ),
      { target: { value: "lowercaseonly" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    expect(
      await screen.findByText(
        "routes.aggregated-institutions.exportDialog.fields.errors.invalidPassword",
      ),
    ).toBeInTheDocument();
  });

  it("should toggle password visibility", () => {
    renderComponent();
    const passwordInput = screen.getByLabelText(
      "routes.aggregated-institutions.exportDialog.fields.newPassword",
    );
    const confirmPasswordInput = screen.getByLabelText(
      "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
    );
    const toggleButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent === "");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButtons[0]);
    fireEvent.click(toggleButtons[1]);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
  });

  it("should submit a valid password and close the dialog", async () => {
    renderComponent();

    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.newPassword",
      ),
      { target: { value: "ValidPassword1" } },
    );
    fireEvent.change(
      screen.getByLabelText(
        "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
      ),
      { target: { value: "ValidPassword1" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("ValidPassword1");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should close the dialog when cancel is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "buttons.cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
