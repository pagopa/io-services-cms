import { List, Stack } from "@mui/material";
import { useTranslation } from "next-i18next";

import ServicePreviewSectionListItem, {
  ServicePreviewSectionListItemProps,
} from "./service-preview-section-list-item";
import ServicePreviewSectionTitle from "./service-preview-section-title";

export interface ServicePreviewSectionListProps {
  items: ServicePreviewSectionListItemProps[];
  title: string;
}

const ServicePreviewSectionList = ({
  items,
  title,
}: ServicePreviewSectionListProps) => {
  const { t } = useTranslation();

  return (
    <Stack>
      <ServicePreviewSectionTitle text={t(title)} />
      <List sx={{ padding: 0 }}>
        {items.map((item, index) => (
          <ServicePreviewSectionListItem
            key={`service-info-${index}`}
            {...item}
            hideDivider={index === items.length - 1 ? true : false}
          />
        ))}
      </List>
    </Stack>
  );
};

export default ServicePreviewSectionList;
