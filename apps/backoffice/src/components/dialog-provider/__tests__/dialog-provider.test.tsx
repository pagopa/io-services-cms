import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DialogProvider, { useDialog } from "../index";

const BO_IO_DIALOG_PROVIDER = "bo-io-dialog-provider";
const BO_IO_BUTTON = "bo-io-button-exit";

let onConfirm = vi.fn();
let onCancel = vi.fn();
let confirmLabel: string | undefined = "confirm";
let cancelLabel: string | undefined = "cancel";

const ButtonTestComponent = () => {
  const showDialog = useDialog();

  const handleShowModal = async () => {
    const confirmed = await showDialog({
      title: "title test",
      message: "desc test",
      confirmButtonLabel: confirmLabel,
      cancelButtonLabel: cancelLabel
    });
    if (confirmed) {
      onConfirm();
    } else {
      onCancel();
    }
  };

  return <button data-testid={BO_IO_BUTTON} onClick={handleShowModal}></button>;
};

const getDialogProviderComponent = () => (
  <DialogProvider>
    <ButtonTestComponent />
  </DialogProvider>
);

const resetProps = () => {
  onConfirm = vi.fn();
  onCancel = vi.fn();
  confirmLabel = "confirm";
  cancelLabel = "cancel";
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[DialogProvider] Component", () => {
  it("should be rendered", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    fireEvent.click(button);
    const dialog = screen.getByTestId(BO_IO_DIALOG_PROVIDER);
    expect(dialog).toBeDefined();
  });

  it("should trigger confirm button", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    fireEvent.click(button);
    await fireEvent.click(screen.getByText("confirm"));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("should trigger cancel button", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    fireEvent.click(button);
    await fireEvent.click(screen.getByText("cancel"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("Should show the prop values for confirm and cancel buttons", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    fireEvent.click(button);
    const confirmButton = await screen.getByText("confirm");
    const cancelButton = await screen.getByText("cancel");

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });

  it("Should show the default values for confirm and cancel buttons", async () => {
    confirmLabel = undefined;
    cancelLabel = undefined;

    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    fireEvent.click(button);
    const confirmButton = await screen.getByText("buttons.confirm");
    const cancelButton = await screen.getByText("buttons.cancel");

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });
});
