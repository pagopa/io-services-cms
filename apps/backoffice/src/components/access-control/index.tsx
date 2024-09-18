import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

export type AccessControlProps = {
  /** Wrapped component that need access control based on user permissions */
  children: ReactNode;
  /** Optional element to show in case of unmatched permissions.
   * If not specified, nothing will be shown in place of the wrapped `children` */
  renderNoAccess?: ReactNode;
} & RequiredAuthorizations;

/** Wrapper for content rendering based on user permissions/role match */
export const AccessControl = ({
  children,
  renderNoAccess,
  requiredPermissions,
  requiredRole,
}: AccessControlProps) => {
  const { data: session } = useSession();

  const [show] = useState(
    hasRequiredAuthorizations(session, {
      requiredPermissions,
      requiredRole,
    }),
  );

  if (show) return <>{children}</>;
  if (renderNoAccess) return <>{renderNoAccess}</>;
  return <></>;
};
