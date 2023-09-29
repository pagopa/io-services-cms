import { Skeleton, SkeletonProps } from "@mui/material";
import { ReactNode } from "react";

export type LoaderSkeletonProps = {
  loading: boolean;
  style?: SkeletonProps;
  children: ReactNode;
};

/** This loader render a MUI `<Skeleton/>` UI structure while loading */
export const LoaderSkeleton = ({
  loading,
  style,
  children
}: LoaderSkeletonProps) => {
  if (loading) return <Skeleton {...style}>{children}</Skeleton>;
  return children;
};
