import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav } from "@/components/sidenav";
import { Box, Grid } from "@mui/material";
import { JwtUser, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";

import styles from "@/styles/app-layout.module.css";

type AppLayoutProps = {
  hideSidenav?: boolean;
  children: ReactNode;
};

const mockUser: JwtUser = {
  id: "12345",
  name: "Mario",
  surname: "Rossi",
  email: "mario.rossi@email.it"
};
const mockProducts: ProductSwitchItem[] = [
  {
    id: "1",
    title: "App IO",
    productUrl: "",
    linkType: "internal"
  }
];

export const AppLayout = ({ hideSidenav, children }: AppLayoutProps) => {
  const { data } = useSession();
  const parties: PartySwitchItem[] = [];

  if (data?.user?.organization) {
    parties.push({
      id: "1",
      name: data.user.organization.name,
      productRole: data.user.organization.roles[0].role,
      logoUrl: "https://agid.digitalpa.it/media/images/stemma.png" // TODO: get correct image
    });
  }

  return (
    <Box>
      <Box>
        <TopBar user={mockUser} />
      </Box>
      <Box>
        <Header products={mockProducts} parties={parties} />
      </Box>
      <Grid container spacing={0} bgcolor={"#F5F5F5"}>
        {hideSidenav ? null : (
          <Grid item width={360}>
            <Sidenav
              onNavItemClick={index =>
                console.log(`Sidenav item click ${index}`)
              }
            />
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
