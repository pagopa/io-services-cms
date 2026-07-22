import {
  type GroupPermissionCheckStrategy,
  groupBoundPermissionCheckStrategy,
  groupUnboundPermissionCheckStrategy,
} from "./strategy";

/**
 * Selects the service creation authorization strategy from `groupId` alone.
 */
export const getGroupPermissionCheckStrategy = (
  groupId: string | undefined,
): GroupPermissionCheckStrategy =>
  groupId === undefined
    ? groupUnboundPermissionCheckStrategy
    : groupBoundPermissionCheckStrategy(groupId);
