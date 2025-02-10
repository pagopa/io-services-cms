import { FormStepSectionWrapper } from "@/components/forms";
import { SelectController } from "@/components/forms/controllers";
import { Group } from "@/generated/api/Group";
import { InfoOutlined, SupervisedUserCircle } from "@mui/icons-material";
import { Alert, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface ServiceGroupSelectorProps {
  groups?: readonly Group[];
}

/** Group selector component */
export const ServiceGroupSelector = ({ groups }: ServiceGroupSelectorProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const isOperator = () => session?.user?.institution.role === "operator";

  return (
    <FormStepSectionWrapper
      description={t("forms.service.metadata.group.description")}
      icon={<SupervisedUserCircle />}
      key={0}
      title={t("forms.service.metadata.group.title")}
    >
      {isOperator() && (
        <Alert
          icon={<InfoOutlined />}
          severity="info"
          sx={{ marginBottom: 1, marginTop: 3 }}
          variant="standard"
        >
          <Typography variant="body2">
            {t("forms.service.metadata.group.info")}
          </Typography>
        </Alert>
      )}
      <SelectController
        disabled={isOperator() && groups?.length === 1}
        items={
          groups
            ? groups.map((group) => ({
                label: group.name,
                value: group.id,
              }))
            : []
        }
        label={t("forms.service.metadata.group.label")}
        name="metadata.group_id"
        placeholder={t("forms.service.metadata.group.placeholder")}
      />
    </FormStepSectionWrapper>
  );
};
