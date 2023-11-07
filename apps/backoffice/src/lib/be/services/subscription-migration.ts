import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { ManagedInternalError } from "@/lib/be/errors";
import * as E from "fp-ts/lib/Either";
import { getSubscriptionsMigrationClient } from "../subscription-migration-client";

export const getLatestOwnershipClaimStatus = async (
  organizationFiscalCode: string
): Promise<MigrationItemList> => {
  const apiResult = await getSubscriptionsMigrationClient().getLatestOwnershipClaimStatus(
    organizationFiscalCode
  )();

  if (E.isLeft(apiResult)) {
    console.error(
      `An error has occurred while calling subscriptions migration getLatestOwnershipClaimStatus API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError(
      "Error calling subscriptions migration getLatestOwnershipClaimStatus API"
    );
  }

  return apiResult.right;
};

export const getOwnershipClaimStatus = async (
  organizationFiscalCode: string,
  delegateId: string
): Promise<MigrationData> => {
  const apiResult = await getSubscriptionsMigrationClient().getOwnershipClaimStatus(
    organizationFiscalCode,
    delegateId
  )();

  if (E.isLeft(apiResult)) {
    console.error(
      `An error has occurred while calling subscriptions migration getOwnershipClaimStatus API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError(
      "Error calling subscriptions migration getOwnershipClaimStatus API"
    );
  }

  return apiResult.right;
};

export const claimOwnership = async (
  organizationFiscalCode: string,
  delegateId: string
): Promise<void> => {
  const apiResult = await getSubscriptionsMigrationClient().claimOwnership(
    organizationFiscalCode,
    delegateId
  )();

  if (E.isLeft(apiResult)) {
    console.error(
      `An error has occurred while calling subscriptions migration claimOwnership API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError(
      "Error calling subscriptions migration claimOwnership API"
    );
  }
};

export const getDelegatesByOrganization = async (
  organizationFiscalCode: string
): Promise<MigrationDelegateList> => {
  const apiResult = await getSubscriptionsMigrationClient().getDelegatesByOrganization(
    organizationFiscalCode
  )();

  if (E.isLeft(apiResult)) {
    console.error(
      `An error has occurred while calling subscriptions migration getDelegatesByOrganization API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError(
      "Error calling subscriptions migration getDelegatesByOrganization API"
    );
  }

  return apiResult.right;
};
