import { getConfiguration } from "@/config";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import useFetch from "@/hooks/use-fetch";
import { HeaderProduct, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export const Header = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: institutionsData, fetchData: institutionsFetchData } =
    useFetch<UserAuthorizedInstitutions>();

  const getSelfcareInstitutionDashboardUrl = () =>
    `${getConfiguration().SELFCARE_URL}/dashboard/${
      session?.user?.institution.id
    }`;

  const products: ProductSwitchItem[] = [
    {
      id: getConfiguration().BACK_OFFICE_ID,
      linkType: "internal",
      productUrl: "",
      title: getConfiguration().BACK_OFFICE_TITLE,
    },
    {
      id: getConfiguration().SELFCARE_ID,
      linkType: "internal",
      productUrl: getSelfcareInstitutionDashboardUrl(),
      title: getConfiguration().SELFCARE_TITLE,
    },
  ];

  const [parties, setParties] = useState(Array<PartySwitchItem>());
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);

  const selectedProductChange = (product: ProductSwitchItem) => {
    // no action if user click on current product (i.e.: BackOffice IO)
    if (selectedProductId === product.id) return;
    // otherwise navigate to product url (i.e.: SelfCare)
    setSelectedProductId(product.id);
    window.location.href = product.productUrl;
  };

  const selectedPartyChange = (party: PartySwitchItem) => {
    // no action if user click on current institution
    if (selectedPartyId === party.id) return;
    // otherwise perform next/auth logout and navigate to callbackUrl
    setSelectedPartyId(party.id);
    signOut({
      callbackUrl:
        getConfiguration().SELFCARE_TOKEN_EXCHANGE_URL +
        `?institutionId=${party.id}&productId=${products[0].id}`,
    });
  };

  /**
   * Set current user institution _(from session token)_
   *
   * Deliberately independent from the list of authorized institutions in order to have the user session institution at a minimum
   */
  const setCurrentParty = () => {
    if (session?.user) {
      const currentParty: PartySwitchItem = {
        id: session.user.institution.id,
        logoUrl: session.user.institution.logo_url,
        name: session.user.institution.name,
        productRole: t(`roles.${session.user.institution.role}`),
      };
      setParties([currentParty]);
      setSelectedPartyId(currentParty.id);
    }
  };

  /** Build and set list of user authorized institutions _(useful for institution switch)_ */
  const buildPartyList = () => {
    if (session?.user && institutionsData?.authorizedInstitutions) {
      const filteredInstitutions =
        institutionsData.authorizedInstitutions.filter(
          (institution) => institution.id !== session.user?.institution.id,
        );
      const otherParties: PartySwitchItem[] = filteredInstitutions.map(
        (institution) => ({
          id: institution.id ?? "",
          logoUrl: institution.logo_url,
          name: institution.name ?? "",
          productRole: t(`roles.${institution.role}`),
        }),
      );
      setParties([...parties, ...otherParties]);
    }
  };

  useEffect(() => {
    buildPartyList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionsData]);

  useEffect(() => {
    setCurrentParty();
    institutionsFetchData(
      "getUserAuthorizedInstitutions",
      {},
      UserAuthorizedInstitutions,
      {
        notify: "errors",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HeaderProduct
      onSelectedParty={selectedPartyChange}
      onSelectedProduct={selectedProductChange}
      partyId={selectedPartyId}
      partyList={parties}
      productId={selectedProductId}
      productsList={products}
    />
  );
};
