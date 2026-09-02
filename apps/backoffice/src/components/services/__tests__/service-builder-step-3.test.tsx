import { cleanup, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceBuilderStep3 } from "../service-create-update/service-builder-step-3";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../service-create-update/service-extra-configurator", () => ({
  ServiceExtraConfigurator: () => null,
}));

const TestForm = () => {
  const form = useForm({
    defaultValues: {
      authorized_cidrs: [],
      metadata: { group_id: "" },
      suitable_for_minors: false,
    },
  });

  return (
    <FormProvider {...form}>
      <ServiceBuilderStep3 groups={[]} mode="create" session={null} />
    </FormProvider>
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("[ServiceBuilderStep3] Component", () => {
  it("should render suitability when the feature is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_FF_SUITABLE_FOR_MINORS_ENABLED", "true");

    render(<TestForm />);
    const title = screen.getByText("forms.service.suitable_for_minors.title");

    expect(title).toBeInTheDocument();
  });

  it("should not render suitability when the feature is disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_FF_SUITABLE_FOR_MINORS_ENABLED", "false");

    render(<TestForm />);
    const title = screen.queryByText("forms.service.suitable_for_minors.title");

    expect(title).not.toBeInTheDocument();
  });
});
