import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import {
  ClientIp,
  ClientIpMiddleware,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import {
  IResponseErrorValidation,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { BlobService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as UPNG from "upng-js";
import { Logo as LogoPayload } from "../../generated/api/Logo";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "UploadServiceLogoHandler";

type HandlerResponseTypes = IResponseSuccessNoContent | ErrorResponseTypes;

type IUploadServiceLogoHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  logoPayload: LogoPayload
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // An instance of ServiceLifecycle client
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  // An instance of APIM Client
  apimService: ApimUtils.ApimService;
  // Client to Azure Blob Storage
  blobService: BlobService;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const imageValidationErrorResponse = () =>
  ResponseErrorValidation(
    "Image not valid",
    "The base64 representation of the logo is invalid"
  );

const upsertBlobFromImageBuffer = (
  blobService: BlobService,
  containerName: string,
  blobName: string,
  content: Buffer
): TE.TaskEither<Error, O.Option<BlobService.BlobResult>> =>
  pipe(
    TE.taskify<Error, BlobService.BlobResult>((cb) =>
      blobService.createBlockBlobFromText(containerName, blobName, content, cb)
    )(),
    TE.map(O.fromNullable)
  );

export const makeUploadServiceLogoHandler =
  ({
    fsmLifecycleClient,
    apimService,
    blobService,
    telemetryClient,
  }: Dependencies): IUploadServiceLogoHandler =>
  (context, auth, _, __, serviceId, logoPayload) => {
    const lowerCaseServiceId = serviceId.toLowerCase();
    const bufferImage = Buffer.from(logoPayload.logo, "base64");

    return pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      // TODO: serve controllare che il servizio esista in FSM Lifecycle?
      // in teoria sopra controllo che quel serviceId appartenga all'utente
      // di conseguenza so giá se il servizio esiste o meno
      TE.chainW(
        flow(
          fsmLifecycleClient.getStore().fetch,
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
          TE.chainW(
            flow(
              O.fold(
                () =>
                  pipe(
                    ResponseErrorNotFound(
                      "Not found",
                      `${serviceId} not found`
                    ),
                    TE.left
                  ),
                (service) => TE.right(service)
              )
            )
          )
        )
      ),
      TE.chainW((_) =>
        pipe(
          O.tryCatch(() => UPNG.decode(bufferImage)),
          O.fold(
            () =>
              E.left<IResponseErrorValidation, UPNG.Image>(
                imageValidationErrorResponse()
              ),
            (img) => E.right<IResponseErrorValidation, UPNG.Image>(img)
          ),
          TE.fromEither,
          TE.chain(
            TE.fromPredicate(
              (img: UPNG.Image) => img.width > 0 && img.height > 0,
              () => imageValidationErrorResponse()
            )
          ),
          TE.chainW(() =>
            pipe(
              upsertBlobFromImageBuffer(
                blobService,
                "services",
                `${lowerCaseServiceId}.png`,
                bufferImage
              ),
              TE.mapLeft((err) =>
                ResponseErrorInternal(
                  `Error trying to connect to storage ${err.message}`
                )
              ),
              TE.chain(
                O.fold(
                  () =>
                    TE.left(
                      ResponseErrorInternal(
                        "Error trying to upload image logo on storage"
                      )
                    ),
                  (_) => TE.of(ResponseSuccessNoContent())
                )
              )
            )
          )
        )
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.EditService, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
        })
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
        })
      ),
      TE.toUnion
    )();
  };

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: IUploadServiceLogoHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddleware(subscriptionCIDRsModel),
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(LogoPayload)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u, ___, ____) =>
          ipTuple(c, u)
        )
      )
    );
  };
