import { EmptyStateCard } from "@/components/empty-state";
import { Subscription } from "@/generated/api/Subscription";
import { isAdmin, isAtLeastInOneGroup } from "@/utils/auth-util";
import {
  SupervisedUserCircle,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Alert, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface ApiKeysGroupsEmptyStateProps {
  apiKeysGroups?: readonly Subscription[];
  hideAdminWarning?: boolean;
  loading?: boolean;
}

export const ApiKeysGroupsEmptyState = ({
  apiKeysGroups,
  hideAdminWarning,
  loading,
}: ApiKeysGroupsEmptyStateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const hasAtLeastOneApiKeysGroups =
    Array.isArray(apiKeysGroups) && apiKeysGroups.length > 0;

  if (loading) return <></>;

  // admin users
  if (isAdmin(session))
    return (
      !hasAtLeastOneApiKeysGroups &&
      !hideAdminWarning && (
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
      isAtLeastInOneGroup(session) &&
      !hasAtLeastOneApiKeysGroups && (
        <EmptyStateCard
          description="routes.overview.apiKeys.groups.emptyState.operator"
          icon={<SupervisedUserCircle fontSize="medium" />}
        />
      )
    );
};
