import { getConfiguration } from "@/config";
import { HeaderProduct, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

const products: ProductSwitchItem[] = [
  {
    id: getConfiguration().BACK_OFFICE_ID,
    title: getConfiguration().BACK_OFFICE_TITLE,
    productUrl: "",
    linkType: "internal"
  }
];

export const Header = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [parties, setParties] = useState(Array<PartySwitchItem>());
  const [selectedPartyId, setSelectedPartyId] = useState("");

  const selectedPartyChange = (party: PartySwitchItem) => {
    if (selectedPartyId === party.id) return;
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
      productId={products[0].id}
      productsList={products}
      onSelectedProduct={p => console.log("Selected Product:", p.title)}
      onSelectedParty={selectedPartyChange}
      partyList={[parties[0]]} // TODO FIXME
      partyId={selectedPartyId}
    />
  );
};
