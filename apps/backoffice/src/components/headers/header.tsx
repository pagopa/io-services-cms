import { getConfiguration } from "@/config";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { UserInstitutionProducts } from "@/generated/api/UserInstitutionProducts";
import useFetch from "@/hooks/use-fetch";
import {
  trackInstitutionSwitchEvent,
  trackProductSwitchEvent,
} from "@/utils/mix-panel";
import { HeaderProduct, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

const {
  BACK_OFFICE_ID,
  BACK_OFFICE_TITLE,
  SELFCARE_ID,
  SELFCARE_TITLE,
  SELFCARE_TOKEN_EXCHANGE_URL,
  SELFCARE_URL,
} = getConfiguration();

export const Header = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const { data: institutionsData, fetchData: institutionsFetchData } =
    useFetch<UserAuthorizedInstitutions>();

  const { data: productsData, fetchData: productsFetchData } =
    useFetch<UserInstitutionProducts>();

  const initialProducts: ProductSwitchItem[] = [
    {
      id: SELFCARE_ID,
      linkType: "internal",
      productUrl: `${SELFCARE_URL}/dashboard/${session?.user?.institution.id}`,
      title: SELFCARE_TITLE,
    },
    {
      id: BACK_OFFICE_ID,
      linkType: "internal",
      productUrl: "",
      title: BACK_OFFICE_TITLE,
    },
  ];

  const [parties, setParties] = useState(Array<PartySwitchItem>());
  const [products, setProducts] =
    useState<ProductSwitchItem[]>(initialProducts);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProducts.find((p) => p.id === BACK_OFFICE_ID)?.id ?? "",
  );

  const selectedProductChange = (product: ProductSwitchItem) => {
    trackProductSwitchEvent(product.id);

    // no action if user click on current product (i.e.: BackOffice IO)
    if (selectedProductId === product.id) return;
    // navigate to product url (i.e.: SelfCare)
    else if (product.id === SELFCARE_ID) {
      setSelectedProductId(product.id);
      window.location.href = product.productUrl;
    }
    // otherwise perform token-exchange to change product backoffice
    else {
      handleTokenExchange(session?.user?.institution.id as string, product.id);
    }
  };

  const selectedPartyChange = (party: PartySwitchItem) => {
    // no action if user click on current institution
    if (selectedPartyId === party.id) return;
    // otherwise perform next/auth logout and navigate to callbackUrl
    setSelectedPartyId(party.id);
    trackInstitutionSwitchEvent(party.id);

    handleTokenExchange(party.id, BACK_OFFICE_ID);
  };

  const handleTokenExchange = (insitutionId: string, productId: string) => {
    signOut({
      callbackUrl:
        SELFCARE_TOKEN_EXCHANGE_URL +
        `?institutionId=${insitutionId}&productId=${productId}`,
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
    const initialProductsUpdated = initialProducts.map((product) =>
      product.id === BACK_OFFICE_ID
        ? {
            ...product,
            title:
              productsData?.products?.find((p) => p.id === BACK_OFFICE_ID)
                ?.title ?? product.title,
          }
        : product,
    );

    const productList: ProductSwitchItem[] = (productsData?.products ?? [])
      .filter((p) => p.id !== BACK_OFFICE_ID) // exclude only BACKOFFICE IO if present in response
      .map(({ id, title }) => ({
        id,
        linkType: "internal",
        productUrl: "",
        title,
      }));

    setProducts([...initialProductsUpdated, ...productList]);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsData]);

  useEffect(() => {
    setCurrentParty();
    institutionsFetchData(
      "getUserAuthorizedInstitutions",
      {},
      UserAuthorizedInstitutions,
      { notify: "errors" },
    );
    productsFetchData(
      "getUserInstitutionProducts",
      { institutionId: session?.user?.institution.id as string },
      UserInstitutionProducts,
      { notify: "errors" },
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
