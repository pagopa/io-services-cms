import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DialogProvider, { useDialog } from "../index";
import { act } from "react-dom/test-utils";

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
      cancelButtonLabel: cancelLabel,
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
    await act(async () => {
      fireEvent.click(button);
    });
    const dialog = await screen.findByTestId(BO_IO_DIALOG_PROVIDER);
    expect(dialog).toBeDefined();
  });

  it("should trigger confirm button", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    await act(async () => {
      fireEvent.click(button);
    });
    await screen.findByTestId(BO_IO_DIALOG_PROVIDER);
    await act(async () => {
      fireEvent.click(screen.getByText("confirm"));
    });
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it("should trigger cancel button", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    await act(async () => {
      fireEvent.click(button);
    });
    await screen.findByTestId(BO_IO_DIALOG_PROVIDER);
    await act(async () => {
      fireEvent.click(screen.getByText("cancel"));
    });
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it("Should show the prop values for confirm and cancel buttons", async () => {
    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    await act(async () => {
      fireEvent.click(button);
    });
    const confirmButton = await screen.findByText("confirm");
    const cancelButton = await screen.findByText("cancel");

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });

  it("Should show the default values for confirm and cancel buttons", async () => {
    confirmLabel = undefined;
    cancelLabel = undefined;

    render(getDialogProviderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON);
    await act(async () => {
      fireEvent.click(button);
    });
    const confirmButton = await screen.findByText("buttons.confirm");
    const cancelButton = await screen.findByText("buttons.cancel");

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });
});
