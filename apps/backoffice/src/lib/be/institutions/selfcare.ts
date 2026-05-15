import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { InstitutionResponse } from "@/generated/selfcare/InstitutionResponse";
import { PageOfUserGroupResource } from "@/generated/selfcare/PageOfUserGroupResource";
import {
  GroupNotFoundError,
  InstitutionNotFoundError,
  ManagedInternalError,
} from "@/lib/be/errors";
import {
  GroupFilter,
  UserInstitutions,
  getSelfcareClient,
} from "@/lib/be/selfcare-client";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

type RightType<T> = T extends TE.TaskEither<unknown, infer R> ? R : never; // TODO: move to an Utils monorepo package

export const getUserAuthorizedInstitutions = async (
  userId: string,
): Promise<UserInstitutions> => {
  const apiResult =
    await getSelfcareClient().getUserAuthorizedInstitutions(userId)();

  // errore validazione parametri chiamata
  if (E.isLeft(apiResult)) {
    throw new ManagedInternalError(
      "Error calling selfcare getUserAuthorizedInstitutions API",
      apiResult.left.message,
    );
  }

  return apiResult.right;
};

export const getInstitutionById = async (
  id: string,
): Promise<InstitutionResponse> => {
  const apiResult = await getSelfcareClient().getInstitutionById(id)();

  if (E.isLeft(apiResult)) {
    const errorResult = apiResult.left;
    if (
      isAxiosError(errorResult) &&
      errorResult.response?.status === HTTP_STATUS_NOT_FOUND
    ) {
      throw new InstitutionNotFoundError(
        `Institution having id '${id}' does not exists`,
      );
    }

    throw new ManagedInternalError(
      "Error calling selfcare getInstitution API",
      apiResult.left.message,
    );
  }

  return apiResult.right;
};

export const getInstitutionGroups = async (params: {
  institutionId?: string;
  page?: number;
  parentInstitutionId?: string;
  size?: number;
  state?: GroupFilter;
}): Promise<PageOfUserGroupResource> => {
  const apiResult = await getSelfcareClient().getInstitutionGroups({
    institutionId: params.institutionId,
    page: params.page,
    parentInstitutionId: params.parentInstitutionId,
    size: params.size,
    state: params.state,
  })();

  if (E.isLeft(apiResult)) {
    throw new ManagedInternalError(
      "Error calling selfcare getInstitutionGroups API",
      apiResult.left.message,
    );
  }

  return apiResult.right;
};

/**
 * Get Group details by provided groupId and institution
 * @param groupId the group id
 * @param institutionId the institution id
 * @returns the group details
 */
export const getGroup = async (
  id: NonEmptyString,
  institutionId: string,
): Promise<
  RightType<ReturnType<ReturnType<typeof getSelfcareClient>["getGroup"]>>
> => {
  const apiResult = await getSelfcareClient().getGroup(id)();

  if (E.isLeft(apiResult)) {
    const errorResult = apiResult.left;
    if (
      isAxiosError(errorResult) &&
      errorResult.response?.status === HTTP_STATUS_NOT_FOUND
    ) {
      throw new GroupNotFoundError(`Group having id '${id}' does not exists`);
    }

    throw new ManagedInternalError(
      "Error calling selfcare getGroup API",
      apiResult.left.message,
    );
  }

  if (apiResult.right.institutionId !== institutionId) {
    throw new GroupNotFoundError(
      `Group having id '${id}' does not exists for instutution '${institutionId}'`,
    );
  }

  return apiResult.right;
};

export const getInstitutionDelegations = async (
  institutionId: string,
  size?: number,
  page?: number,
  search?: string,
): Promise<
  RightType<
    ReturnType<
      ReturnType<typeof getSelfcareClient>["getInstitutionDelegations"]
    >
  >
> => {
  const apiResult = await getSelfcareClient().getInstitutionDelegations(
    institutionId,
    size,
    page,
    search,
  )();

  if (E.isLeft(apiResult)) {
    throw new ManagedInternalError(
      "Error calling selfcare getDelegatedInstitutions API",
      apiResult.left.message,
    );
  }

  return apiResult.right;
};

/**
 * Get active institution products by provided institutionId and userId
 * @param institutionId the institution id
 * @param userId the user id
 * @returns the active institution products
 */
export const getInstitutionProducts = async (
  institutionId: string,
  userId: string,
): Promise<
  RightType<
    ReturnType<ReturnType<typeof getSelfcareClient>["getInstitutionProducts"]>
  >
> => {
  const apiResult = await getSelfcareClient().getInstitutionProducts(
    institutionId,
    userId,
  )();

  if (E.isLeft(apiResult)) {
    throw new ManagedInternalError(
      "Error calling selfcare getInstitutionProducts API",
      apiResult.left.message,
    );
  }

  return apiResult.right;
};
