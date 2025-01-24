import { EmptyStateCard } from "@/components/empty-state";
import { Subscription } from "@/generated/api/Subscription";
import {
  SupervisedUserCircle,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Alert, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface ApiKeysGroupsEmptyStateProps {
  apiKeysGroups?: readonly Subscription[];
}

export const ApiKeysGroupsEmptyState = ({
  apiKeysGroups,
}: ApiKeysGroupsEmptyStateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const isAdmin = session?.user?.institution.role === "admin";

  const hasAtLeastOneGroup =
    session?.user?.permissions.selcGroups &&
    session?.user?.permissions.selcGroups.length > 0;

  const hasAtLeastOneApiKeysGroups =
    Array.isArray(apiKeysGroups) && apiKeysGroups.length > 0;

  // admin users
  if (isAdmin)
    return (
      !hasAtLeastOneApiKeysGroups && (
        <Alert
          icon={<WarningAmberOutlined />}
          severity="warning"
          variant="outlined"
        >
          <Typography variant="body2">
            {t("routes.overview.apiKeys.groups.emptyState.admin")}
          </Typography>
        </Alert>
      )
    );
  // operator users
  else
    return (
      hasAtLeastOneGroup &&
      !hasAtLeastOneApiKeysGroups && (
        <EmptyStateCard
          description="routes.overview.apiKeys.groups.emptyState.operator"
          icon={<SupervisedUserCircle fontSize="medium" />}
        />
      )
    );
};
