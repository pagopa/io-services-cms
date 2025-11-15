import { Activations } from "@io-services-cms/models";
import { ActivationStatusEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ActivationStatus";
import {
  ActivationModel,
  NewActivation,
} from "@pagopa/io-functions-commons/dist/src/models/activation";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

interface HandlerDependencies {
  readonly legacyActivationModel: ActivationModel;
}

const cmsToLegacy = (activation: Activations.Activation): NewActivation => ({
  fiscalCode: activation.fiscalCode,
  kind: "INewActivation",
  serviceId: activation.serviceId,
  status: toLegacyStatus(activation.status),
});

const toLegacyStatus = (
  status: Activations.Activation["status"],
): Activations.LegacyCosmosResource["status"] => {
  switch (status) {
    case "ACTIVE":
      return ActivationStatusEnum.ACTIVE;
    case "INACTIVE":
      return ActivationStatusEnum.INACTIVE;
    case "PENDING":
      return ActivationStatusEnum.PENDING;
    default:
      // Should never happen if validation is correct
      return ActivationStatusEnum.INACTIVE;
  }
};

export const makeHandler =
  ({
    legacyActivationModel,
  }: HandlerDependencies): RTE.ReaderTaskEither<
    { inputs: unknown[] },
    Error,
    void
  > =>
  ({ inputs }) =>
    pipe(
      inputs[0] as Buffer,
      (blob) => blob.toString("utf-8"),
      E.tryCatchK(JSON.parse, E.toError),
      E.chain(
        flow(
          Activations.Activation.decode,
          E.mapLeft(flow(readableReport, (e) => new Error(e))),
        ),
      ),
      TE.fromEither,
      TE.chainW((activation) =>
        pipe(
          cmsToLegacy(activation),
          (newActivation) => legacyActivationModel.upsert(newActivation),
          TE.mapLeft((err) => {
            if (err instanceof Error) {
              return err;
            } else {
              switch (err.kind) {
                case "COSMOS_EMPTY_RESPONSE":
                case "COSMOS_CONFLICT_RESPONSE":
                  return new Error(err.kind);
                case "COSMOS_DECODING_ERROR":
                  return E.toError(JSON.stringify(err.error));
                case "COSMOS_ERROR_RESPONSE":
                  return E.toError(err.error.message);
                default:
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations
                  const _: never = err;
                  return new Error(`should not have executed this with ${err}`);
              }
            }
          }),
        ),
      ),
      TE.map(() => void 0),
    );
