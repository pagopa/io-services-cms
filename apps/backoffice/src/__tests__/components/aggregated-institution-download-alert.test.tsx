/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AggregatedInstitutionDownloadAlert } from "../../components/aggregated-institutions/aggregated-institution-download-alert";
import { StateEnum as NotReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysExportFileMetadataNotReady";
import { StateEnum as ReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysExportFileMetadataReady";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "it-IT" },
    t: (key: string, options?: { expirationDate?: string }) =>
      options?.expirationDate ? `${key}:${options.expirationDate}` : key,
  }),
}));

describe("[AggregatedInstitutionDownloadAlert] Component", () => {
  it("should not render anything when link metadata is undefined", () => {
    const { container } = render(
      <AggregatedInstitutionDownloadAlert
        data={undefined}
        onRefresh={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render the success state with download action", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{
          downloadLink: "https://example.com/manage-keys.json",
          expirationDate: "2026-04-15T10:00:00",
          state: ReadyStateEnum.DONE,
        }}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.success.title",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.success.description:15-04-2026",
      ),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "routes.aggregated-institutions.downloadAlert.success.action",
    });

    expect(link).toHaveAttribute(
      "href",
      "https://example.com/manage-keys.json",
    );
    expect(link).toHaveAttribute("download", "I tuoi enti.json");
  });

  it("should render the in-progress state and refresh on action click", () => {
    const onRefresh = vi.fn();

    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.IN_PROGRESS }}
        onRefresh={onRefresh}
      />,
    );

    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.inProgress.title",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.inProgress.description",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.downloadAlert.inProgress.action",
      }),
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("should render the failure state without actions", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.FAILED }}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.failure.title",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "routes.aggregated-institutions.downloadAlert.failure.description",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
