import { HeaderProduct, ProductSwitchItem } from "@pagopa/mui-italia";
import { PartySwitchItem } from "@pagopa/mui-italia/dist/components/PartySwitch";

export type HeaderProps = {
  products: ProductSwitchItem[];
  parties: PartySwitchItem[];
};

export const Header = ({ products, parties }: HeaderProps) => {
  return (
    <HeaderProduct
      productId="1"
      productsList={products}
      onSelectedProduct={(p) => console.log("Selected Item:", p.title)}
      partyList={[parties[0]]}
    />
  );
};
