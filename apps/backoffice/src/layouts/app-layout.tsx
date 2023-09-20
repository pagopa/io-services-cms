import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav } from "@/components/sidenav";
import { Box, Grid } from "@mui/material";
import { JwtUser } from "@pagopa/mui-italia";
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

export const AppLayout = ({ hideSidenav, children }: AppLayoutProps) => {
  return (
    <Box>
      <Box>
        <TopBar user={mockUser} />
      </Box>
      <Box>
        <Header />
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
