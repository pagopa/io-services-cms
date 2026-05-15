/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AggregatedInstitutionDownloadAlert } from "../../components/aggregated-institutions/aggregated-institution-download-alert";
import { StateEnum as NotReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysExportFileMetadataNotReady";
import { StateEnum as ReadyStateEnum } from "../../generated/api/AggregatedInstitutionsManageKeysExportFileMetadataReady";
import {
  trackEaFileGenerateCompletedEvent,
  // trackEaFileGenerateDownloadEvent,
  trackEaFileGenerateEndEvent,
  trackEaFileGenerateErrorEvent,
  trackEaFileGenerateProgressEvent,
  trackEaFileGenerateRefreshEvent,
} from "../../utils/mix-panel";

const { mockFetchDownloadLink, mockUseFetch, mockGenerateDirectDownloadLink } =
  vi.hoisted(() => {
    const mockFetchDownloadLink = vi.fn();
    const mockGenerateDirectDownloadLink = vi.fn();
    const mockUseFetch = vi.fn(() => ({
      data: undefined,
      error: undefined,
      fetchData: mockFetchDownloadLink,
      loading: false,
    }));
    return {
      mockFetchDownloadLink,
      mockUseFetch,
      mockGenerateDirectDownloadLink,
    };
  });

vi.mock("@/hooks/use-fetch", () => ({
  default: mockUseFetch,
  client: {
    generateDirectDownloadLinkForAggregatedInstitutionsManageKeys:
      mockGenerateDirectDownloadLink,
  },
}));

vi.mock("../../utils/mix-panel", () => ({
  trackEaFileGenerateCompletedEvent: vi.fn(),
  trackEaFileGenerateDownloadEvent: vi.fn(),
  trackEaFileGenerateEndEvent: vi.fn(),
  trackEaFileGenerateErrorEvent: vi.fn(),
  trackEaFileGenerateProgressEvent: vi.fn(),
  trackEaFileGenerateRefreshEvent: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "it-IT" },
    t: (key: string, options?: { expirationDate?: string }) =>
      options?.expirationDate ? `${key}:${options.expirationDate}` : key,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("should render the success state with download button", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{
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

    expect(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.downloadAlert.success.action",
      }),
    ).toBeInTheDocument();
  });

  it("should call fetchDownloadLink and trigger anchor download on button click", async () => {
    const anchorClickSpy = vi
      .spyOn(HTMLElement.prototype, "click")
      .mockImplementation(() => undefined);
    mockFetchDownloadLink.mockResolvedValueOnce({
      data: { downloadLink: "https://example.com/fresh-link.json" },
      success: true,
    });

    render(
      <AggregatedInstitutionDownloadAlert
        data={{
          expirationDate: "2026-04-15T10:00:00",
          state: ReadyStateEnum.DONE,
        }}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.downloadAlert.success.action",
      }),
    );

    await waitFor(() => {
      expect(mockFetchDownloadLink).toHaveBeenCalledWith(
        "generateDirectDownloadLinkForAggregatedInstitutionsManageKeys",
        {},
        expect.anything(),
        { notify: "errors" },
      );
      expect(anchorClickSpy).toHaveBeenCalledOnce();
    });

    anchorClickSpy.mockRestore();
  });

  it("should not trigger anchor download when fetchDownloadLink fails", async () => {
    const anchorClickSpy = vi
      .spyOn(HTMLElement.prototype, "click")
      .mockImplementation(() => undefined);
    mockFetchDownloadLink.mockResolvedValueOnce({
      error: { kind: "httpError", message: "serverError", status: 500 },
      success: false,
    });

    render(
      <AggregatedInstitutionDownloadAlert
        data={{
          expirationDate: "2026-04-15T10:00:00",
          state: ReadyStateEnum.DONE,
        }}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.downloadAlert.success.action",
      }),
    );

    await waitFor(() => {
      expect(mockFetchDownloadLink).toHaveBeenCalledOnce();
      expect(anchorClickSpy).not.toHaveBeenCalled();
    });

    anchorClickSpy.mockRestore();
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
    expect(vi.mocked(trackEaFileGenerateRefreshEvent)).toHaveBeenCalledTimes(1);
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
      <AggregatedInstitutionDownloadAlert
        data={undefined}
        onRefresh={vi.fn()}
      />,
    );

    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateEndEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateRefreshEvent)).not.toHaveBeenCalled();
  });

  it("should fire progressEvent when state is IN_PROGRESS", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.IN_PROGRESS }}
        onRefresh={vi.fn()}
      />,
    );

    expect(vi.mocked(trackEaFileGenerateProgressEvent)).toHaveBeenCalledTimes(
      1,
    );
    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateEndEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateRefreshEvent)).not.toHaveBeenCalled();
  });

  // it("should fire completedEvent and endEvent(success) when state is DONE", () => {
  //   render(
  //     <AggregatedInstitutionDownloadAlert
  //       data={{
  //         expirationDate: "2026-04-15T10:00:00",
  //         state: ReadyStateEnum.DONE,
  //       }}
  //       onRefresh={vi.fn()}
  //     />,
  //   );

  //   expect(vi.mocked(trackEaFileGenerateCompletedEvent)).toHaveBeenCalledTimes(
  //     1,
  //   );
  //   expect(vi.mocked(trackEaFileGenerateEndEvent)).toHaveBeenCalledWith(
  //     "success",
  //   );
  //   expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
  //   expect(vi.mocked(trackEaFileGenerateErrorEvent)).not.toHaveBeenCalled();
  // });

  it("should fire errorEvent and endEvent(error) when state is FAILED", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.FAILED }}
        onRefresh={vi.fn()}
      />,
    );

    expect(vi.mocked(trackEaFileGenerateErrorEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackEaFileGenerateEndEvent)).toHaveBeenCalledWith(
      "error",
    );
    expect(vi.mocked(trackEaFileGenerateCompletedEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(trackEaFileGenerateProgressEvent)).not.toHaveBeenCalled();
  });

  // it("should fire downloadEvent when the download link is clicked", () => {
  //   render(
  //     <AggregatedInstitutionDownloadAlert
  //       data={{
  //         expirationDate: "2026-04-15T10:00:00",
  //         state: ReadyStateEnum.DONE,
  //       }}
  //       onRefresh={vi.fn()}
  //     />,
  //   );

  //   fireEvent.click(
  //     screen.getByRole("button", {
  //       name: "routes.aggregated-institutions.downloadAlert.success.action",
  //     }),
  //   );

  //   expect(vi.mocked(trackEaFileGenerateDownloadEvent)).toHaveBeenCalledTimes(
  //     1,
  //   );
  // });

  it("should fire refreshEvent when the refresh button is clicked", () => {
    render(
      <AggregatedInstitutionDownloadAlert
        data={{ state: NotReadyStateEnum.IN_PROGRESS }}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.downloadAlert.inProgress.action",
      }),
    );

    expect(vi.mocked(trackEaFileGenerateRefreshEvent)).toHaveBeenCalledTimes(1);
  });
});
