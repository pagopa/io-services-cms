import { UserContract } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { InstitutionResponse } from "@io-services-cms/external-clients/generated/selfcare/InstitutionResponse";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

export const createApimUser =
  (apimService: ApimUtils.ApimService, apimUserGroups: readonly string[]) =>
  (institution: InstitutionResponse): TE.TaskEither<Error, void> =>
    pipe(
      apimService.createOrUpdateUser({
        email: ApimUtils.formatEmailForOrganization(institution.id),
        firstName: institution.taxCode,
        lastName: institution.id,
        note: institution.description,
      }),
      TE.mapLeft(
        (err) =>
          new Error(
            `Failed to create apim user: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
          ),
      ),
      TE.chainW((apimUser) =>
        pipe(
          apimUserGroups,
          RA.map((groupId) =>
            createUserGroup(apimService)(
              apimUser.name as NonEmptyString,
              groupId,
            ),
          ),
          TE.sequenceSeqArray,
        ),
      ),
      TE.map(() => void 0),
    );

const createUserGroup =
  (apimService: ApimUtils.ApimService) =>
  (
    apimUserId: NonEmptyString,
    groupId: string,
  ): TE.TaskEither<Error, UserContract> =>
    pipe(
      apimService.createGroupUser(groupId as NonEmptyString, apimUserId),
      TE.mapLeft(
        (err) =>
          new Error(
            `Failed to create relationship between group (id = ${groupId}) and user (id = ${apimUserId}) caused by: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
          ),
      ),
    );
