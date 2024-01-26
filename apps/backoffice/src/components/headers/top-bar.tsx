import { getConfiguration } from "@/config";
import { HeaderAccount, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { useRouter } from "next/router";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel
};

export type TopBarProps = {
  user: false | JwtUser | undefined;
  hideAssistance?: boolean;
};

export const TopBar = ({ user, hideAssistance }: TopBarProps) => {
  const router = useRouter();

  const handleDocumentationClick = () =>
    window.open(getConfiguration().BACK_OFFICE_OPERATIVE_MANUAL_URL, "_blank");

  return (
    <HeaderAccount
      rootLink={pagoPALink}
      loggedUser={user}
      enableAssistanceButton={false}
      onAssistanceClick={() =>
        router.push({
          pathname: "/assistance",
          query: { callbackUrl: router.asPath }
        })
      }
      onDocumentationClick={handleDocumentationClick}
      onLogin={() => {
        console.log("User login");
      }}
      onLogout={() => router.push("/auth/logout")}
    />
  );
};
