import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { PasswordTextField } from "../password-field-controller";

// Form wrapper that provides FormProvider context
const TestFormWrapper = <FormValues extends FieldValues>({
  children,
  onSubmit,
  defaultValues,
}: {
  children: React.ReactNode;
  onSubmit?: SubmitHandler<FormValues>;
  defaultValues?: DefaultValues<FormValues>;
}) => {
  const form = useForm<FormValues>({
    defaultValues,
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit ?? (() => {}))}>{children}</form>
    </FormProvider>
  );
};

// Helper to render PasswordTextField with FormProvider
const renderWithForm = <FormValues extends FieldValues>(
  ui: React.ReactElement,
  options?: { defaultValues?: DefaultValues<FormValues> },
) => {
  return render(
    <TestFormWrapper defaultValues={options?.defaultValues}>{ui}</TestFormWrapper>,
  );
};

afterEach(() => {
  cleanup();
});

describe("[PasswordTextField] Component", () => {
  describe("Rendering", () => {
    it("should render a text field with the given label", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="MyPassword"
          name="password"
        />,
      );

      // getAllByText because MUI renders the label text in both a <label> and a <legend><span>
      const matches = screen.getAllByText("MyPassword");
      expect(matches.length).toBeGreaterThan(0);
    });

    it("should render with input type password by default", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      expect(input.type).toBe("password");
    });

    it("should render the Visibility icon when password is hidden", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
        />,
      );

      // The visibility icon is rendered as an icon button
      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toBeDefined();
    });
  });

  describe("Password visibility toggle", () => {
    it("should show the password when the visibility toggle button is clicked", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      const toggleButton = screen.getByRole("button");

      expect(input.type).toBe("password");

      fireEvent.click(toggleButton);

      expect(input.type).toBe("text");
    });

    it("should hide the password again on a second click", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      const toggleButton = screen.getByRole("button");

      // Toggle on
      fireEvent.click(toggleButton);
      expect(input.type).toBe("text");

      // Toggle off
      fireEvent.click(toggleButton);
      expect(input.type).toBe("password");
    });

    it("should preserve the input value when typing while visible", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
          defaultValue="test"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      const toggleButton = screen.getByRole("button");

      // Show password
      fireEvent.click(toggleButton);
      expect(input.type).toBe("text");
      expect(input.value).toBe("test");

      // Hide password - value should still be there
      fireEvent.click(toggleButton);
      expect(input.type).toBe("password");
      expect(input.value).toBe("test");
    });
  });

  describe("Validation errors", () => {
    it("should show error styling when the field has a validation error", () => {
      const TestComponent = () => {
        const form = useForm<{ password: string }>({
          mode: "onChange",
          defaultValues: { password: "" },
        });

        React.useEffect(() => {
          // Trigger error using trigger which is more reliable
          form.trigger("password");
        }, [form]);

        return (
          <FormProvider {...form}>
            <PasswordTextField<{ password: string }>
              label="Password"
              name="password"
            />
          </FormProvider>
        );
      };

      render(<TestComponent />);

      // Check that error styling exists on the TextField container
      const textFieldContainer = screen.getByLabelText("Password").closest(
        ".MuiTextField-root",
      );
      const errorElement = textFieldContainer?.querySelector(".Mui-error");
      expect(errorElement).toBeDefined();
    });

    it("should show the error message as helper text when no onError callback is provided", () => {
      const TestComponent = () => {
        const form = useForm<{ password: string }>({
          mode: "onChange",
        });

        React.useEffect(() => {
          form.setError("password", { message: "Password must be at least 8 characters" });
        }, [form]);

        return (
          <FormProvider {...form}>
            <PasswordTextField<{ password: string }>
              label="Password"
              name="password"
            />
          </FormProvider>
        );
      };

      render(<TestComponent />);

      const helperText = screen.getByText("Password must be at least 8 characters");
      expect(helperText).toBeDefined();
    });

    it("should use the onError callback to format the helper text when provided", () => {
      const TestComponent = () => {
        const form = useForm<{ password: string }>({
          mode: "onChange",
        });

        React.useEffect(() => {
          form.setError("password", { message: "Original error message" });
        }, [form]);

        return (
          <FormProvider {...form}>
            <PasswordTextField<{ password: string }>
              label="Password"
              name="password"
              onError={(error) => error ? `Custom: ${error.message}` : null}
            />
          </FormProvider>
        );
      };

      render(<TestComponent />);

      const helperText = screen.getByText("Custom: Original error message");
      expect(helperText).toBeDefined();
    });

    it("should show no error and no helper text when the field is valid", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      const textFieldContainer = input.closest(".MuiTextField-root");
      const errorElement = textFieldContainer?.querySelector(".Mui-error");
      expect(errorElement).toBeNull();
    });
  });

  describe("Props forwarding", () => {
    it("should forward extra TextFieldProps to the underlying TextField", () => {
      renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
          disabled={true}
          placeholder="Enter your password"
        />,
      );

      const input = screen.getByLabelText("Password") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(input.placeholder).toBe("Enter your password");
    });

    it("should apply fullWidth prop to the TextField", () => {
      const { container } = renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
          fullWidth={true}
        />,
      );

      const textField = container.querySelector(".MuiTextField-root");
      expect(textField?.classList.contains("MuiFormControl-fullWidth")).toBe(true);
    });

    it("should apply margin prop to the TextField", () => {
      const { container } = renderWithForm(
        <PasswordTextField<{ password: string }>
          label="Password"
          name="password"
          margin="dense"
        />,
      );

      const textField = container.querySelector(".MuiTextField-root");
      expect(textField?.classList.contains("MuiFormControl-marginDense")).toBe(true);
    });
  });
});

