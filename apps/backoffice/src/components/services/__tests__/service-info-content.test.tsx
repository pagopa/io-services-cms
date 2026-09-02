import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeEnum } from "../../../generated/api/ServiceBaseMetadata";
import { ServiceLifecycleStatusTypeEnum } from "../../../generated/api/ServiceLifecycleStatusType";
import { Service } from "../../../types/service";

import { ServiceInfoContent } from "../service-info-content";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const service: Service = {
  authorized_cidrs: [],
  authorized_recipients: [],
  description: "A service description",
  id: "a-service-id",
  lastUpdate: "2026-07-29T10:00:00.000Z",
  max_allowed_payment_amount: 0,
  metadata: { scope: ScopeEnum.LOCAL },
  name: "A service",
  require_secure_channel: false,
  status: { value: ServiceLifecycleStatusTypeEnum.draft },
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FF_SUITABLE_FOR_MINORS_ENABLED", "true");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("[ServiceInfoContent] Component", () => {
  it("should not render suitability when the field is undefined", () => {
    render(<ServiceInfoContent data={service} />);
    const suitability = screen.queryByText(
      "routes.service.suitable_for_minors",
    );

    expect(suitability).not.toBeInTheDocument();
  });

  it("should render suitability when its value is true", () => {
    render(
      <ServiceInfoContent data={{ ...service, suitable_for_minors: true }} />,
    );
    const suitability = screen.getByText("routes.service.suitable_for_minors");

    expect(suitability).toBeInTheDocument();
  });

  it("should not render suitability when its value is false", () => {
    render(
      <ServiceInfoContent data={{ ...service, suitable_for_minors: false }} />,
    );
    const suitability = screen.queryByText(
      "routes.service.suitable_for_minors",
    );

    expect(suitability).not.toBeInTheDocument();
  });

  it("should not render suitability when the feature is disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_FF_SUITABLE_FOR_MINORS_ENABLED", "false");

    render(
      <ServiceInfoContent data={{ ...service, suitable_for_minors: true }} />,
    );
    const suitability = screen.queryByText(
      "routes.service.suitable_for_minors",
    );

    expect(suitability).not.toBeInTheDocument();
  });
});
