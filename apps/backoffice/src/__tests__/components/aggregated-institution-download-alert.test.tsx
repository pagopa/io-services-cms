/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AggregatedInstitutionDownloadAlert } from "../../components/aggregated-institutions/aggregated-institution-download-alert";
import { StateEnum as NotReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysLinkNotReady";
import { StateEnum as ReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysLinkReady";
import {
  trackEaFileGenerateCompletedEvent,
  trackEaFileGenerateDownloadEvent,
  trackEaFileGenerateEndEvent,
  trackEaFileGenerateErrorEvent,
  trackEaFileGenerateProgressEvent,
} from "../../utils/mix-panel";

vi.mock("../../utils/mix-panel", () => ({
  trackEaFileGenerateCompletedEvent: vi.fn(),
  trackEaFileGenerateDownloadEvent: vi.fn(),
  trackEaFileGenerateEndEvent: vi.fn(),
  trackEaFileGenerateErrorEvent: vi.fn(),
  trackEaFileGenerateProgressEvent: vi.fn(),
}));

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

describe("[AggregatedInstitutionDownloadAlert] Tracking events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not fire any tracking event when data is undefined", () => {
    render(
      <AggregatedInstitutionDownloadAlert data={undefined} onRefresh={vi.fn()} />,
    );

    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateEndEvent)).not.toHaveBeenCalled();
  });

  it("should fire progressEvent when state is IN_PROGRESS", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.IN_PROGRESS }}
        onRefresh={vi.fn()}
      />,
    );

    expect(vi.mocked(trackEaFileGenerateProgressEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateEndEvent)).not.toHaveBeenCalled();
  });

  it("should fire completedEvent and endEvent(success) when state is DONE", () => {
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

    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGenerateEndEvent)).toHaveBeenCalledWith("success");
    expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
  });

  it("should fire errorEvent and endEvent(error) when state is FAILED", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.FAILED }}
        onRefresh={vi.fn()}
      />,
    );

    expect(vi.mocked(trackEaFileGenerateErrorEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGenerateEndEvent)).toHaveBeenCalledWith("error");
    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
  });

  it("should fire downloadEvent when the download link is clicked", () => {
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

    fireEvent.click(
      screen.getByRole("link", {
        name: "routes.aggregated-institutions.downloadAlert.success.action",
      }),
    );

    expect(vi.mocked(trackEaFileGenerateDownloadEvent)).toHaveBeenCalledTimes(1);
  });
});
