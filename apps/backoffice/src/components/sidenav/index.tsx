import useScreenSize from "@/hooks/use-screen-size";
import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { ExitToAppRounded, Menu } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Fragment, ReactElement, useEffect, useRef, useState } from "react";

export type SidenavItem = {
  href: string;
  icon: JSX.Element | null;
  text: string;
  linkType: "internal" | "external";
  hasBottomDivider?: boolean;
} & RequiredAuthorizations;

export type SidenavProps = {
  /** Sidenav menu items */
  items: SidenavItem[];
  /** Sidenav menu width change event */
  onWidthChange: (width: number) => void;
};

export const Sidenav = ({ items, onWidthChange }: SidenavProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();

  const theme = useTheme();
  const screenSize = useScreenSize();

  const [settings, setSettings] = useState({ width: 300, collapse: false });
  const prevWidthRef = useRef<number | null>(null);

  /** Render a tooltip wrapper on menu item text when menu is closed _(collapse=true)_ */
  const renderTooltipOnCollapse = (text: string, children: ReactElement) =>
    settings.collapse ? (
      <Tooltip title={text} placement="right" arrow>
        {children}
      </Tooltip>
    ) : (
      <>{children}</>
    );

  /** Closes the menu */
  const setMenuCollapsed = () => {
    setSettings({ width: 87, collapse: true });
    updateWidthRef();
  };

  /** Open the menu */
  const setMenuOpen = (width: number) => {
    setSettings({ width, collapse: false });
    updateWidthRef();
  };

  /** Handle click on menu item:
   * - `internal` link will perform nextjs router transition
   * - `external` link, as for external URLs, `window.open` will be used
   *
   * https://nextjs.org/docs/pages/api-reference/functions/use-router#routerpush
   */
  const handleMenuClick = (item: SidenavItem) => {
    item.linkType === "internal"
      ? router.push(item.href)
      : window.open(item.href, "_blank");
  };

  /**
   * Manage menu opening state
   * @param force if true, force menu open
   */
  const manageMenuOpen = (force?: boolean) => {
    if (screenSize.width >= theme.breakpoints.values.xl) {
      setMenuOpen(320);
    } else if (
      (screenSize.width >= theme.breakpoints.values.lg &&
        screenSize.width <= theme.breakpoints.values.xl) ||
      force
    ) {
      setMenuOpen(280);
    }
  };

  /** keep previous width reference updated */
  const updateWidthRef = () => (prevWidthRef.current = settings.width);

  // first useEffect to manage menu opened/closed based on screen width
  useEffect(() => {
    manageMenuOpen();
    if (screenSize.width <= theme.breakpoints.values.lg) {
      setMenuCollapsed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenSize.width]);

  // second useEffect to trigger onWidthChange to parent only if menu size change
  useEffect(() => {
    if (
      prevWidthRef.current !== null &&
      settings.width !== prevWidthRef.current
    ) {
      onWidthChange(settings.width);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.width]);

  return (
    <Box
      id="sidenav"
      sx={{
        height: "100%",
        maxWidth: settings.width,
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <Box id="menu-items">
        <List component="nav" aria-label="menu-back-office">
          {items
            .filter(({ requiredPermissions, requiredRole }) =>
              hasRequiredAuthorizations(session, {
                requiredRole,
                requiredPermissions
              })
            )
            .map((item, index) => (
              <Fragment key={index}>
                {renderTooltipOnCollapse(
                  t(item.text),
                  <ListItemButton
                    selected={
                      router.pathname === item.href ||
                      (item.href.length > 1 &&
                        router.pathname.startsWith(item.href))
                    }
                    onClick={() => handleMenuClick(item)}
                  >
                    <ListItemIcon
                      sx={
                        settings.collapse
                          ? { marginLeft: 2, marginRight: 4 }
                          : {}
                      }
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={settings.collapse ? "" : t(item.text)}
                    />
                    {item.linkType === "external" && !settings.collapse ? (
                      <ListItemIcon>
                        <ExitToAppRounded color="action" />
                      </ListItemIcon>
                    ) : null}
                  </ListItemButton>
                )}
                {item.hasBottomDivider ? <Divider /> : null}
              </Fragment>
            ))}
        </List>
      </Box>

      <Box id="open-close">
        <Divider />
        <IconButton
          aria-label="open-close"
          sx={{ margin: 2.75 }}
          onClick={_ =>
            settings.collapse ? manageMenuOpen(true) : setMenuCollapsed()
          }
        >
          <Menu />
        </IconButton>
      </Box>
    </Box>
  );
};
