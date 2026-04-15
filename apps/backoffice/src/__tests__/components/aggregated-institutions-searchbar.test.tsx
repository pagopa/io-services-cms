/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InstitutionSearchByNameProps } from "../../components/institutions";
import {
  AggregatedInstitutionsSearchBar,
  AggregatedInstitutionsSearchBarProps,
} from "../../components/aggregated-institutions/aggregated-institutions-searchbar";

const mockInstitutionSearchByName = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/institutions", () => ({
  InstitutionSearchByName: (props: unknown) => {
    mockInstitutionSearchByName(props);
    return <div data-testid="institution-search-by-name" />;
  },
}));

type AggregatedSearchBarTestProps = AggregatedInstitutionsSearchBarProps &
  InstitutionSearchByNameProps;

const baseProps: AggregatedSearchBarTestProps = {
  onEmptySearch: vi.fn(),
  onGenerateClick: vi.fn(),
  onSearchClick: vi.fn(),
};

describe("[AggregatedInstitutionsSearchBar] Component", () => {
  it("should render the search bar and generate button, forwarding search props", () => {
    render(<AggregatedInstitutionsSearchBar {...baseProps} />);

    expect(
      screen.getByTestId("institution-search-by-name"),
    ).toBeInTheDocument();
    expect(mockInstitutionSearchByName).toHaveBeenCalledWith(
      expect.objectContaining({
        onEmptySearch: baseProps.onEmptySearch,
        onSearchClick: baseProps.onSearchClick,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.exportDialog.generateButton",
      }),
    );

    expect(baseProps.onGenerateClick).toHaveBeenCalledTimes(1);
  });

  it("should hide the generate button when hideGenerate is true", () => {
    render(<AggregatedInstitutionsSearchBar {...baseProps} hideGenerate />);

    expect(
      screen.queryByRole("button", {
        name: "routes.aggregated-institutions.exportDialog.generateButton",
      }),
    ).not.toBeInTheDocument();
  });

  it("should disable the generate button when disableGenerate is true", () => {
    render(<AggregatedInstitutionsSearchBar {...baseProps} disableGenerate />);

    expect(
      screen.getByRole("button", {
        name: "routes.aggregated-institutions.exportDialog.generateButton",
      }),
    ).toBeDisabled();
  });
});
