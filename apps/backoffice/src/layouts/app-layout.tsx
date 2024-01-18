import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav, SidenavItem } from "@/components/sidenav";
import {
  Category,
  People,
  SupervisedUserCircle,
  ViewSidebar,
  VpnKey
} from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

import styles from "@/styles/app-layout.module.css";
import { getConfiguration } from "@/config";

type AppLayoutProps = {
  hideSidenav?: boolean;
  hideHeader?: boolean;
  children: ReactNode;
};

export const AppLayout = ({
  hideSidenav,
  hideHeader,
  children
}: AppLayoutProps) => {
  const { data: session } = useSession();
  const [sidenavWidth, setSidenavWidth] = useState(320);

  const getSelfcareInstitutionDashboardUrl = () =>
    `${getConfiguration().SELFCARE_URL}/dashboard/${
      session?.user?.institution.id
    }`;

  /** List of sidenav menu items _(displayed on left side column)_ */
  const menu: Array<SidenavItem> = [
    {
      href: "/",
      icon: <ViewSidebar fontSize="inherit" />,
      text: "routes.overview.title",
      linkType: "internal"
    },
    {
      href: "/services",
      icon: <Category fontSize="inherit" />,
      text: "routes.services.title",
      linkType: "internal"
    },
    {
      href: "/keys",
      icon: <VpnKey fontSize="inherit" />,
      text: "routes.keys.title",
      linkType: "internal",
      hasBottomDivider: true,
      requiredPermissions: ["ApiServiceWrite"]
    },
    {
      href: `${getSelfcareInstitutionDashboardUrl()}/users`,
      icon: <People fontSize="inherit" />,
      text: "routes.users.title",
      linkType: "external",
      requiredRole: "admin"
    },
    {
      href: `${getSelfcareInstitutionDashboardUrl()}/groups`,
      icon: <SupervisedUserCircle fontSize="inherit" />,
      text: "routes.groups.title",
      linkType: "external",
      requiredRole: "admin"
    }
  ];

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <TopBar user={session?.user ? { id: session.user.id } : undefined} />
      {hideHeader ? null : <Header />}
      <Grid container spacing={0} bgcolor={"#F5F5F5"} flexGrow={1}>
        {hideSidenav ? null : (
          <Grid item width={sidenavWidth}>
            <Sidenav items={menu} onWidthChange={setSidenavWidth} />
          </Grid>
        )}
        <Grid item className={styles.main}>
          {children}
        </Grid>
      </Grid>
      <Box>
        <AppFooter loggedUser={true} currentLanguage={"it"} />
      </Box>
    </Box>
  );
};
