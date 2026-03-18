import { InvocationContext } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { ClientIpMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { PatchServicePayload } from "../../generated/api/PatchServicePayload";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { checkSourceIp } from "../../utils/check-source-ip";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "PatchServiceHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  telemetryClient: TelemetryClient;
}

type EditServiceHandler = (
  context: InvocationContext,
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: PatchServicePayload,
) => TE.TaskEither<ErrorResponseTypes, IResponseSuccessNoContent>;

export const makePatchServiceHandler =
  ({
    apimService,
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): EditServiceHandler =>
  (context, auth, serviceId, servicePayload) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW((sId) =>
        pipe(
          fsmLifecycleClientCreator()
            .getStore()
            .patch(sId, { data: { ...servicePayload } }),
          TE.mapLeft((err) =>
            ResponseErrorInternal("Failed to patch caused by: " + err.message),
          ),
          TE.map(ResponseSuccessNoContent),
        ),
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.EditService, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
    );

export const applyRequestMiddelwares =
  (config: IConfig) =>
  (handler: EditServiceHandler): ReturnType<typeof wrapHandlerV4> => {
    const middlewares = [
      // extract the client IP from the request
      ClientIpMiddleware,
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(PatchServicePayload),
    ] as const;
    return wrapHandlerV4(middlewares, (...args) =>
      pipe(
        args,
        ([clientIp, ...rest]) =>
          pipe(
            checkSourceIp(
              clientIp,
              new Set(config.BACKOFFICE_INTERNAL_SUBNET_CIDRS),
            ),
            E.map((_) => rest),
          ),
        TE.fromEither,
        TE.chainW((args) => handler(...args)),
        TE.toUnion,
      )(),
    );
  };
