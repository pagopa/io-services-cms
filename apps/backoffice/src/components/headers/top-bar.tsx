import { getConfiguration } from "@/config";
import { HeaderAccount, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { useRouter } from "next/router";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel,
};

export interface TopBarProps {
  hideAssistance?: boolean;
  user: JwtUser | false | undefined;
}

export const TopBar = ({ hideAssistance, user }: TopBarProps) => {
  const router = useRouter();

  const handleDocumentationClick = () =>
    window.open(getConfiguration().BACK_OFFICE_OPERATIVE_MANUAL_URL, "_blank");

  const handleAssistanceClick = () =>
    window.open(
      `${getConfiguration().SELFCARE_URL}/assistenza?productId=${
        getConfiguration().BACK_OFFICE_ID
      }`,
      "_self",
    );

  return (
    <HeaderAccount
      enableAssistanceButton={hideAssistance}
      loggedUser={user}
      onAssistanceClick={handleAssistanceClick}
      onDocumentationClick={handleDocumentationClick}
      onLogin={() => {
        console.log("User login");
      }}
      onLogout={() => router.push("/auth/logout")}
      rootLink={pagoPALink}
    />
  );
};
