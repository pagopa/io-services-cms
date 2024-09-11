import { ArrowForwardIos } from "@mui/icons-material";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export const PageBreadcrumbs = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const removeQueryParamsIfExists = (route: string) => {
    const queryParamsStartIndex = route.indexOf("?");
    return queryParamsStartIndex >= 0
      ? route.substring(0, queryParamsStartIndex)
      : route;
  };

  /** Starting from current browser route, returns an array of route sections without query parameters _(if any)_ */
  const getRouteSections = () =>
    removeQueryParamsIfExists(router.asPath)
      .split("/")
      .filter((val) => val !== "");

  const routeSectionsCount = getRouteSections().length;

  /** Returns route translation */
  const getRouteLocale = (route: string) => {
    const routeLocale = t(`routes.${route}.title`);
    if (routeLocale.startsWith("routes.")) return route;
    return routeLocale;
  };

  /** Manage page breadcrumbs component visibility: `true` only if current route has a nesting level greater than 1. */
  const isVisible = () => routeSectionsCount > 1;

  /**
   * Check if a route section is the last of whole route sections _(child route)_
   * @param routeSectionIndex index of the route section inside routeSections array
   * @returns `true` for a child route, otherwise `false`
   */
  const isChildRoute = (routeSectionIndex: number) =>
    routeSectionIndex === routeSectionsCount - 1;

  /** Returns route section path */
  const getRouteSectionPath = (routeSection: string) =>
    router.asPath.substring(
      0,
      router.asPath.indexOf(routeSection) + routeSection.length,
    );

  if (!isVisible()) return;
  return (
    <Box id="bo-io-breadcrumbs" marginBottom={2}>
      <Breadcrumbs separator={<ArrowForwardIos sx={{ fontSize: 8 }} />}>
        {getRouteSections().map((crumb, index) =>
          isChildRoute(index) ? (
            <Typography color={"text.disabled"} key={index}>
              {getRouteLocale(crumb)}
            </Typography>
          ) : (
            <NextLink href={getRouteSectionPath(crumb)} key={index}>
              <Typography fontWeight={600}>{getRouteLocale(crumb)}</Typography>
            </NextLink>
          ),
        )}
      </Breadcrumbs>
    </Box>
  );
};
