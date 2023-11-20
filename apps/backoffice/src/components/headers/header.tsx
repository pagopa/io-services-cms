import { getConfiguration } from "@/config";
import { HeaderProduct, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export const Header = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const getSelfcareInstitutionDashboardUrl = () =>
    `${getConfiguration().SELFCARE_URL}/dashboard/${
      session?.user?.institution.id
    }`;

  const products: ProductSwitchItem[] = [
    {
      id: getConfiguration().BACK_OFFICE_ID,
      title: getConfiguration().BACK_OFFICE_TITLE,
      productUrl: "",
      linkType: "internal"
    },
    {
      id: getConfiguration().SELFCARE_ID,
      title: getConfiguration().SELFCARE_TITLE,
      productUrl: getSelfcareInstitutionDashboardUrl(),
      linkType: "internal"
    }
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
        `?institutionId=${party.id}&productId=${products[0].id}`
    });
  };

  useEffect(() => {
    if (session?.user) {
      const currentParty: PartySwitchItem = {
        id: session.user.institution.id,
        name: session.user.institution.name,
        productRole: t(`roles.${session.user.institution.role}`),
        logoUrl: session.user.institution.logo_url
      };
      const filteredInstitutions = session.user.authorizedInstitutions.filter(
        institution => institution.id !== session.user?.institution.id
      );
      const otherParties: PartySwitchItem[] = filteredInstitutions.map(
        institution => ({
          id: institution.id ?? "",
          name: institution.name ?? "",
          productRole: t(`roles.${institution.role}`),
          logoUrl: institution.logo_url
        })
      );
      setParties([currentParty, ...otherParties]);
      setSelectedPartyId(currentParty.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HeaderProduct
      productId={selectedProductId}
      productsList={products}
      onSelectedProduct={selectedProductChange}
      onSelectedParty={selectedPartyChange}
      partyList={parties}
      partyId={selectedPartyId}
    />
  );
};
