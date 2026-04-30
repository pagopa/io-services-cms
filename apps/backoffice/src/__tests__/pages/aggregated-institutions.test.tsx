/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as E from "fp-ts/lib/Either";
import { useSession } from "next-auth/react";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AggregatedInstitutions from "../../pages/aggregated-institutions";

// ---------------------------------------------------------------------------
// Hoisted mocks (available inside vi.mock factories)
// ---------------------------------------------------------------------------
const {
  mockFetchData,
  mockUseFetch,
  mockGetManageSubscriptionKeys,
  mockRegenerateInstitutionAggregateManageSubscriptionsKey,
  mockShowDialog,
  mockEnqueueSnackbar,
  mockIsAdmin,
  mockTrackAggregatedInstitutionsPageEvent,
} = vi.hoisted(() => {
  const mockFetchData = vi.fn();
  const mockUseFetch = vi.fn(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: undefined as any,
    error: undefined,
    fetchData: mockFetchData,
    loading: false,
  }));
  const mockGetManageSubscriptionKeys = vi.fn();
  const mockRegenerateInstitutionAggregateManageSubscriptionsKey = vi.fn();
  const mockShowDialog = vi.fn();
  const mockEnqueueSnackbar = vi.fn();
  const mockIsAdmin = vi.fn(() => false);
  const mockTrackAggregatedInstitutionsPageEvent = vi.fn();

  return {
    mockFetchData,
    mockUseFetch,
    mockGetManageSubscriptionKeys,
    mockRegenerateInstitutionAggregateManageSubscriptionsKey,
    mockShowDialog,
    mockEnqueueSnackbar,
    mockIsAdmin,
    mockTrackAggregatedInstitutionsPageEvent,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/hooks/use-fetch", () => ({
  default: mockUseFetch,
  client: {
    retrieveInstitutionAggregateManageSubscriptionsKeys:
      mockGetManageSubscriptionKeys,
    regenerateInstitutionAggregateManageSubscriptionsKey:
      mockRegenerateInstitutionAggregateManageSubscriptionsKey,
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("next-auth/react");
const mockUseSession = useSession as Mock;

vi.mock("next-i18next", () => ({
  Trans: ({ i18nKey }: any) => i18nKey,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock("@/components/dialog-provider", () => ({
  useDialog: () => mockShowDialog,
}));

vi.mock("@/utils/mix-panel", () => ({
  trackAggregatedInstitutionsPageEvent:
    mockTrackAggregatedInstitutionsPageEvent,
  trackEaManageKeyCopyEvent: vi.fn(),
  trackEaManageKeyRegenerateEvent: vi.fn(),
  trackEaManageKeyShowEvent: vi.fn(),
}));

vi.mock("@/utils/auth-util", () => ({
  isAdmin: mockIsAdmin,
}));

vi.mock("@/components/empty-state", () => ({
  EmptyStateLayer: () => <div data-testid="empty-state" />,
}));

vi.mock("@/components/institutions", () => ({
  InstitutionSearchByName: () => <div data-testid="institution-search" />,
}));

vi.mock("@/components/headers", () => ({
  PageHeader: ({ title, description }: any) => (
    <div data-testid="page-header">
      <span data-testid="page-title">{title}</span>
      <span data-testid="page-description">{description}</span>
    </div>
  ),
}));

vi.mock("@/components/notification", () => ({
  buildSnackbarItem: (opts: any) => opts,
}));

vi.mock("@/components/api-keys/api-key-value-async", () => ({
  ApiKeyValueAsync: () => <span data-testid="api-key-value-async" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockSessionAdmin = {
  status: "authenticated",
  data: {
    user: {
      institution: { id: "inst-001", role: "admin", isAggregator: true },
      permissions: { apimGroups: [] },
    },
  },
};

const mockSessionOperator = {
  status: "authenticated",
  data: {
    user: {
      institution: { id: "inst-001", role: "operator", isAggregator: true },
      permissions: { apimGroups: [] },
    },
  },
};

const mockPaginationData = {
  value: [
    { id: "agg-1", name: "Institution Alpha" },
    { id: "agg-2", name: "Institution Beta" },
  ],
  pagination: { count: 2, limit: 10, offset: 0 },
};

const mockEmptyPaginationData = {
  value: [],
  pagination: { count: 0, limit: 10, offset: 0 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setupFetch = (data: any, loading = false) =>
  mockUseFetch.mockReturnValue({
    data,
    error: undefined,
    fetchData: mockFetchData,
    loading,
  });

const setupOperatorMocks = (data: any = mockPaginationData) => {
  mockIsAdmin.mockReturnValue(false);
  mockUseSession.mockReturnValue(mockSessionOperator);
  setupFetch(data);
};

const setupAdminMocks = (data: any = mockPaginationData) => {
  mockIsAdmin.mockReturnValue(true);
  mockUseSession.mockReturnValue(mockSessionAdmin);
  setupFetch(data);
};

const mockKeysOkResponse = E.right({
  status: 200,
  value: { primary_key: "pk", secondary_key: "sk" },
});

const triggerShowAndWait = async () => {
  openMenu();
  fireEvent.click(screen.getByText("aggregated-institution.actions.show"));
  await waitFor(() =>
    expect(mockGetManageSubscriptionKeys).toHaveBeenCalledTimes(1),
  );
};

const renderPage = async () => {
  render(<AggregatedInstitutions />);
  await waitFor(() => screen.getByText("Institution Alpha"));
};

const openMenu = (index = 0) => {
  fireEvent.click(screen.getAllByRole("button", { name: "more" })[index]);
};

const renderPageAndOpenMenu = async () => {
  await renderPage();
  openMenu();
};

const triggerRegenerateKey = async (keyType: "primary" | "secondary") => {
  await renderPageAndOpenMenu();
  fireEvent.click(
    screen.getByText(
      `aggregated-institution.actions.regenerate${keyType === "primary" ? "Pk" : "Sk"}`,
    ),
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("[AggregatedInstitutions] Page", () => {
  describe("Rendering", () => {
    beforeEach(() => setupOperatorMocks(undefined));

    it("should render the page header", () => {
      render(<AggregatedInstitutions />);

      expect(screen.getByTestId("page-header")).toBeDefined();
      expect(screen.getByTestId("page-title")).toHaveTextContent(
        "routes.aggregated-institutions.title",
      );
      expect(screen.getByTestId("page-description")).toHaveTextContent(
        "routes.aggregated-institutions.description",
      );
    });

    it("should render table and search when institutions are present", async () => {
      setupFetch(mockPaginationData);

      render(<AggregatedInstitutions />);

      await waitFor(() => {
        expect(screen.getByTestId("institution-search")).toBeDefined();
        expect(screen.getByTestId("table-view")).toBeDefined();
      });
    });

    it("should render table rows with institution names", async () => {
      setupFetch(mockPaginationData);

      render(<AggregatedInstitutions />);

      await waitFor(() => {
        expect(screen.getByText("Institution Alpha")).toBeInTheDocument();
        expect(screen.getByText("Institution Beta")).toBeInTheDocument();
      });
    });

    it("should show empty state when no institutions and no active search", async () => {
      setupFetch(mockEmptyPaginationData);

      render(<AggregatedInstitutions />);

      await waitFor(() => {
        expect(screen.getByTestId("empty-state")).toBeDefined();
        expect(screen.queryByTestId("table-view")).toBeNull();
        expect(screen.queryByTestId("institution-search")).toBeNull();
      });
    });

    it("should show table loading state", () => {
      setupFetch(undefined, true);

      render(<AggregatedInstitutions />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("Tracking", () => {
    beforeEach(() => setupOperatorMocks(undefined));

    it("should track page view event on mount", () => {
      render(<AggregatedInstitutions />);

      expect(mockTrackAggregatedInstitutionsPageEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("Fetch behaviour on mount", () => {
    beforeEach(() => setupOperatorMocks(undefined));

    it("should fetch aggregated institutions and download link metadata", () => {
      render(<AggregatedInstitutions />);

      expect(mockFetchData).toHaveBeenCalledTimes(2);

      expect(mockFetchData).toHaveBeenCalledWith(
        "retrieveInstitutionAggregates",
        expect.objectContaining({
          institutionId: "inst-001",
          limit: 10,
          offset: 0,
        }),
        expect.anything(),
        expect.objectContaining({ notify: "errors" }),
      );

      expect(mockFetchData).toHaveBeenCalledWith(
        "getAggregatedInstitutionsManageKeysLink",
        {},
        expect.anything(),
      );
    });
  });

  describe("Row context menu — operator (non-admin)", () => {
    beforeEach(() => setupOperatorMocks());

    it("should return only show action for hidden institution", async () => {
      await renderPageAndOpenMenu();

      const items = screen.getAllByRole("menuitem");
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent("aggregated-institution.actions.show");
    });

    it("should return hide action after show has been triggered", async () => {
      mockGetManageSubscriptionKeys.mockResolvedValue(mockKeysOkResponse);

      await renderPage();
      await triggerShowAndWait();

      // Reopen menu — after re-render, menu should show "hide"
      openMenu();
      await waitFor(() => {
        const items = screen.getAllByRole("menuitem");
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent(
          "aggregated-institution.actions.hide",
        );
      });
    });
  });

  describe("Row context menu — admin", () => {
    beforeEach(() => setupAdminMocks());

    it("should return show + regeneratePk + regenerateSk actions for hidden institution", async () => {
      await renderPageAndOpenMenu();

      const items = screen.getAllByRole("menuitem");
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent("aggregated-institution.actions.show");
      expect(items[1]).toHaveTextContent(
        "aggregated-institution.actions.regeneratePk",
      );
      expect(items[2]).toHaveTextContent(
        "aggregated-institution.actions.regenerateSk",
      );
    });

    it("should return hide + regeneratePk + regenerateSk actions after show is triggered", async () => {
      mockGetManageSubscriptionKeys.mockResolvedValue(mockKeysOkResponse);

      await renderPage();
      await triggerShowAndWait();

      // Reopen menu — should show hide + regeneratePk + regenerateSk
      openMenu();
      await waitFor(() => {
        const items = screen.getAllByRole("menuitem");
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent(
          "aggregated-institution.actions.hide",
        );
        expect(items[1]).toHaveTextContent(
          "aggregated-institution.actions.regeneratePk",
        );
        expect(items[2]).toHaveTextContent(
          "aggregated-institution.actions.regenerateSk",
        );
      });
    });
  });

  describe("Show subscription keys action", () => {
    beforeEach(() => setupOperatorMocks());

    it("should call getManageSubscriptionKeys when showing keys for the first time", async () => {
      mockGetManageSubscriptionKeys.mockResolvedValue(mockKeysOkResponse);

      await renderPageAndOpenMenu();
      fireEvent.click(screen.getByText("aggregated-institution.actions.show"));

      await waitFor(() =>
        expect(mockGetManageSubscriptionKeys).toHaveBeenCalledWith({
          aggregateId: "agg-1",
        }),
      );
    });

    it("should not call getManageSubscriptionKeys when keys are already loaded", async () => {
      mockGetManageSubscriptionKeys.mockResolvedValue(mockKeysOkResponse);

      await renderPage();

      // First show: fetches keys
      await triggerShowAndWait();

      // After show, isVisible=true → menu shows "hide"
      openMenu();
      await waitFor(() =>
        expect(
          screen.getByText("aggregated-institution.actions.hide"),
        ).toBeInTheDocument(),
      );

      // Click hide → sets isVisible: false (primary_key remains in state)
      fireEvent.click(screen.getByText("aggregated-institution.actions.hide"));

      // Open menu again → should show "show"
      openMenu();
      await waitFor(() =>
        expect(
          screen.getByText("aggregated-institution.actions.show"),
        ).toBeInTheDocument(),
      );

      // Second show: primary_key already in state → should NOT call getManageSubscriptionKeys again
      fireEvent.click(screen.getByText("aggregated-institution.actions.show"));
      await waitFor(() =>
        expect(mockGetManageSubscriptionKeys).toHaveBeenCalledTimes(1),
      );
    });

    it("should show a generic error notification and set placeholder keys when the client returns a Left", async () => {
      mockGetManageSubscriptionKeys.mockResolvedValue(
        E.left(new Error("network error")),
      );

      await renderPageAndOpenMenu();
      fireEvent.click(screen.getByText("aggregated-institution.actions.show"));

      await waitFor(() =>
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: "error",
            title: "notifications.genericError",
          }),
        ),
      );

      // isVisible is set to true with placeholder keys → menu item switches to "hide"
      openMenu();
      await waitFor(() =>
        expect(
          screen.getByText("aggregated-institution.actions.hide"),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("Regenerate key action (admin)", () => {
    beforeEach(() => setupAdminMocks());

    it("should open confirmation dialog before regenerating primary key", async () => {
      mockShowDialog.mockResolvedValue(false); // user cancels

      await triggerRegenerateKey("primary");

      await waitFor(() =>
        expect(mockShowDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            confirmButtonLabel: expect.any(String),
            title: expect.any(String),
            message: expect.any(String),
          }),
        ),
      );
      expect(
        mockRegenerateInstitutionAggregateManageSubscriptionsKey,
      ).not.toHaveBeenCalled();
    });

    it("should call regenerateInstitutionAggregateManageSubscriptionsKey when user confirms", async () => {
      mockShowDialog.mockResolvedValue(true); // user confirms
      mockRegenerateInstitutionAggregateManageSubscriptionsKey.mockResolvedValue(
        E.right({
          status: 200,
          value: { primary_key: "new-pk", secondary_key: "old-sk" },
        }),
      );

      await triggerRegenerateKey("primary");

      await waitFor(() =>
        expect(
          mockRegenerateInstitutionAggregateManageSubscriptionsKey,
        ).toHaveBeenCalledWith({
          aggregateId: "agg-1",
          keyType: "primary",
        }),
      );
    });

    it("should call regenerateInstitutionAggregateManageSubscriptionsKey with secondary key type", async () => {
      mockShowDialog.mockResolvedValue(true);
      mockRegenerateInstitutionAggregateManageSubscriptionsKey.mockResolvedValue(
        E.right({
          status: 200,
          value: { primary_key: "old-pk", secondary_key: "new-sk" },
        }),
      );

      await triggerRegenerateKey("secondary");

      await waitFor(() =>
        expect(
          mockRegenerateInstitutionAggregateManageSubscriptionsKey,
        ).toHaveBeenCalledWith({
          aggregateId: "agg-1",
          keyType: "secondary",
        }),
      );
    });
  });
});
