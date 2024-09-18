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
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { Fragment, ReactElement, useEffect, useRef, useState } from "react";

export type SidenavItem = {
  hasBottomDivider?: boolean;
  href: string;
  icon: JSX.Element | null;
  linkType: "external" | "internal";
  text: string;
} & RequiredAuthorizations;

export interface SidenavProps {
  /** Sidenav menu items */
  items: SidenavItem[];
  /** Sidenav menu width change event */
  onWidthChange: (width: number) => void;
}

export const Sidenav = ({ items, onWidthChange }: SidenavProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();

  const theme = useTheme();
  const screenSize = useScreenSize();

  const [settings, setSettings] = useState({ collapse: false, width: 300 });
  const prevWidthRef = useRef<null | number>(null);

  /** Render a tooltip wrapper on menu item text when menu is closed _(collapse=true)_ */
  const renderTooltipOnCollapse = (text: string, children: ReactElement) =>
    settings.collapse ? (
      <Tooltip arrow placement="right" title={text}>
        {children}
      </Tooltip>
    ) : (
      <>{children}</>
    );

  /** Closes the menu */
  const setMenuCollapsed = () => {
    setSettings({ collapse: true, width: 87 });
    updateWidthRef();
  };

  /** Open the menu */
  const setMenuOpen = (width: number) => {
    setSettings({ collapse: false, width });
    updateWidthRef();
  };

  /** Handle click on menu item:
   * - `internal` link will perform nextjs router transition
   * - `external` link, as for external URLs, `window.open` will be used
   *
   * https://nextjs.org/docs/pages/api-reference/functions/use-router#routerpush
   */
  const handleMenuClick = (item: SidenavItem) => {
    if (item.linkType === "internal") {
      router.push(item.href);
    } else {
      window.open(item.href, "_blank");
    }
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
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        maxWidth: settings.width,
      }}
    >
      <Box id="menu-items">
        <List aria-label="menu-back-office" component="nav">
          {items
            .filter(({ requiredPermissions, requiredRole }) =>
              hasRequiredAuthorizations(session, {
                requiredPermissions,
                requiredRole,
              }),
            )
            .map((item, index) => (
              <Fragment key={index}>
                {renderTooltipOnCollapse(
                  t(item.text),
                  <ListItemButton
                    onClick={() => handleMenuClick(item)}
                    selected={
                      router.pathname === item.href ||
                      (item.href.length > 1 &&
                        router.pathname.startsWith(item.href))
                    }
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
                  </ListItemButton>,
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
          onClick={(_) =>
            settings.collapse ? manageMenuOpen(true) : setMenuCollapsed()
          }
          sx={{ margin: 2.75 }}
        >
          <Menu />
        </IconButton>
      </Box>
    </Box>
  );
};
