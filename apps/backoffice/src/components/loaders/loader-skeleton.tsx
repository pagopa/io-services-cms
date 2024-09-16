import { Skeleton, SkeletonProps } from "@mui/material";
import { ReactNode } from "react";

export interface LoaderSkeletonProps {
  children: ReactNode;
  loading: boolean;
  style?: SkeletonProps;
}

/** This loader render a MUI `<Skeleton/>` UI structure while loading */
export const LoaderSkeleton = ({
  children,
  loading,
  style,
}: LoaderSkeletonProps) => {
  if (loading)
    return (
      <Skeleton data-testid="bo-io-loader-skeleton" {...style}>
        {children}
      </Skeleton>
    );
  return children;
};
