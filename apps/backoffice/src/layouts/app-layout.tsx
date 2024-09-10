import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav, SidenavItem } from "@/components/sidenav";
import { getConfiguration } from "@/config";
import styles from "@/styles/app-layout.module.css";
import {
  Category,
  People,
  SupervisedUserCircle,
  ViewSidebar,
  VpnKey,
} from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
  hideAssistance?: boolean;
  hideHeader?: boolean;
  hideSidenav?: boolean;
}

export const AppLayout = ({
  children,
  hideAssistance,
  hideHeader,
  hideSidenav,
}: AppLayoutProps) => {
  const { data: session } = useSession();
  const [sidenavWidth, setSidenavWidth] = useState(320);

  const getSelfcareInstitutionDashboardUrl = () =>
    `${getConfiguration().SELFCARE_URL}/dashboard/${
      session?.user?.institution.id
    }`;

  /** List of sidenav menu items _(displayed on left side column)_ */
  const menu: SidenavItem[] = [
    {
      href: "/",
      icon: <ViewSidebar fontSize="inherit" />,
      linkType: "internal",
      text: "routes.overview.title",
    },
    {
      href: "/services",
      icon: <Category fontSize="inherit" />,
      linkType: "internal",
      text: "routes.services.title",
    },
    {
      hasBottomDivider: true,
      href: "/keys",
      icon: <VpnKey fontSize="inherit" />,
      linkType: "internal",
      requiredPermissions: ["ApiServiceWrite"],
      text: "routes.keys.title",
    },
    {
      href: `${getSelfcareInstitutionDashboardUrl()}/users`,
      icon: <People fontSize="inherit" />,
      linkType: "external",
      requiredRole: "admin",
      text: "routes.users.title",
    },
    {
      href: `${getSelfcareInstitutionDashboardUrl()}/groups`,
      icon: <SupervisedUserCircle fontSize="inherit" />,
      linkType: "external",
      requiredRole: "admin",
      text: "routes.groups.title",
    },
  ];

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <TopBar
        hideAssistance={hideAssistance}
        user={session?.user ? { id: session.user.id } : undefined}
      />
      {hideHeader ? null : <Header />}
      <Grid bgcolor={"#F5F5F5"} container flexGrow={1} spacing={0}>
        {hideSidenav ? null : (
          <Grid item width={sidenavWidth}>
            <Sidenav items={menu} onWidthChange={setSidenavWidth} />
          </Grid>
        )}
        <Grid className={styles.main} item>
          {children}
        </Grid>
      </Grid>
      <Box>
        <AppFooter currentLanguage={"it"} loggedUser={true} />
      </Box>
    </Box>
  );
};
