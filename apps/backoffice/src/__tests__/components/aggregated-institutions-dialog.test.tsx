/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AggregatedInstitutionsDialog } from "../../components/aggregated-institutions/aggregated-institutions-dialog";
import {
  trackEaFileGeneratePasswordCancelEvent,
  trackEaFileGeneratePasswordConfirmEvent,
  trackEaFileGeneratePasswordEvent,
  trackEaFileGeneratePasswordMissingEvent,
  trackEaFileGeneratePasswordNotCompliantEvent,
  trackEaFileGeneratePasswordUnmatchedEvent,
} from "../../utils/mix-panel";

vi.mock("../../utils/mix-panel", () => ({
  trackEaFileGeneratePasswordCancelEvent: vi.fn(),
  trackEaFileGeneratePasswordConfirmEvent: vi.fn(),
  trackEaFileGeneratePasswordEvent: vi.fn(),
  trackEaFileGeneratePasswordMissingEvent: vi.fn(),
  trackEaFileGeneratePasswordNotCompliantEvent: vi.fn(),
  trackEaFileGeneratePasswordUnmatchedEvent: vi.fn(),
}));

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

describe("[AggregatedInstitutionsDialog] Tracking events", () => {
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

  it("should fire passwordEvent with 'new_password' when dialog opens without existing download", () => {
    renderComponent();

    expect(vi.mocked(trackEaFileGeneratePasswordEvent)).toHaveBeenCalledWith(
      "new_password",
    );
    expect(vi.mocked(trackEaFileGeneratePasswordEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
  });

  it("should fire passwordEvent with 'replacement' when dialog opens with an existing download", () => {
    renderComponent({ isDownloadReady: true });

    expect(vi.mocked(trackEaFileGeneratePasswordEvent)).toHaveBeenCalledWith(
      "replacement",
    );
    expect(vi.mocked(trackEaFileGeneratePasswordEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
  });

  it("should fire cancelEvent when the cancel button is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "buttons.cancel" }));

    expect(
      vi.mocked(trackEaFileGeneratePasswordCancelEvent),
    ).toHaveBeenCalledWith("new_password");
    expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
  });

  it("should fire confirmEvent when a valid password is submitted", async () => {
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
      expect(
        vi.mocked(trackEaFileGeneratePasswordConfirmEvent),
      ).toHaveBeenCalledWith("new_password");
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire missingEvent when required fields are empty on submit", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordMissingEvent),
      ).toHaveBeenCalledWith("new_password");
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire notCompliantEvent when the password does not meet security rules", async () => {
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

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent),
      ).toHaveBeenCalledWith("new_password");
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire unmatchedEvent when the passwords do not match", async () => {
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
      { target: { value: "AnotherPassword1" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent),
      ).toHaveBeenCalledWith("new_password");
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire cancelEvent with 'replacement' when cancel is clicked and a download is already available", () => {
    renderComponent({ isDownloadReady: true });

    fireEvent.click(screen.getByRole("button", { name: "buttons.cancel" }));

    expect(
      vi.mocked(trackEaFileGeneratePasswordCancelEvent),
    ).toHaveBeenCalledWith("replacement");
    expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
  });

  it("should fire confirmEvent with 'replacement' when a valid password is submitted and a download is already available", async () => {
    renderComponent({ isDownloadReady: true });

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
      expect(
        vi.mocked(trackEaFileGeneratePasswordConfirmEvent),
      ).toHaveBeenCalledWith("replacement");
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire missingEvent with 'replacement' when required fields are empty and a download is already available", async () => {
    renderComponent({ isDownloadReady: true });

    fireEvent.click(screen.getByRole("button", { name: "buttons.confirm" }));

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordMissingEvent),
      ).toHaveBeenCalledWith("replacement");
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire notCompliantEvent with 'replacement' when the password does not meet security rules and a download is already available", async () => {
    renderComponent({ isDownloadReady: true });

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

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent),
      ).toHaveBeenCalledWith("replacement");
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).not.toHaveBeenCalled();
    });
  });

  it("should fire unmatchedEvent with 'replacement' when the passwords do not match and a download is already available", async () => {
    renderComponent({ isDownloadReady: true });

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

    await waitFor(() => {
      expect(
        vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent),
      ).toHaveBeenCalledWith("replacement");
      expect(vi.mocked(trackEaFileGeneratePasswordUnmatchedEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(trackEaFileGeneratePasswordCancelEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordConfirmEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordMissingEvent)).not.toHaveBeenCalled();
      expect(vi.mocked(trackEaFileGeneratePasswordNotCompliantEvent)).not.toHaveBeenCalled();
    });
  });
});
