import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

type usefulPermissions =
  | "apiadmin"
  | "apilimitedmessagewrite"
  | "apiservicewrite";

export type AccessControlProps = {
  /** permissions to match for render wrapped `children` */
  requiredPermissions: Array<usefulPermissions> | Array<string>;
  /** Optional element to show in case of unmatched permissions.
   * If not specified, nothing will be shown in place of the wrapped `children` */
  renderNoAccess?: ReactNode;
  /** Wrapped component that need access control based on user permissions */
  children: ReactNode;
};

/** Wrapper for content rendering based on user permissions match */
export const AccessControl = ({
  requiredPermissions,
  renderNoAccess,
  children
}: AccessControlProps) => {
  const { data: session } = useSession();

  const isArraySubset = (subset: string[], superset: string[]) =>
    subset.every(item => superset.includes(item));

  const hasRequiredPermissions = () =>
    isArraySubset(requiredPermissions, session?.user?.permissions as string[]);

  const [show] = useState(hasRequiredPermissions());

  if (show) return <>{children}</>;
  if (renderNoAccess) return <>{renderNoAccess}</>;
  return <></>;
};
