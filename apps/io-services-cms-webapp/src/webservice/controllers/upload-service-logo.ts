import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { IAzureUserAttributesManage } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
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
import {
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { BlobService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as UPNG from "upng-js";
import { IConfig } from "../../config";
import { Logo as LogoPayload } from "../../generated/api/Logo";
import { upsertBlobFromImageBuffer } from "../../lib/azure/blob-storage";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
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
  // An instance of APIM Client
  apimService: ApimUtils.ApimService;
  // Client to Azure Blob Storage
  blobService: BlobService;
  telemetryClient: TelemetryClient;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const imageValidationErrorResponse = (details?: string) =>
  ResponseErrorValidation(
    "Image not valid",
    details ?? "The base64 representation of the logo is invalid"
  );

const validateImage = (bufferImage: Buffer) =>
  pipe(
    E.tryCatch(
      () => UPNG.decode(bufferImage),
      (err) =>
        imageValidationErrorResponse(
          `Fail decoding provided image, the reason is: ${
            err instanceof Error ? err.message : err
          }`
        )
    ),
    E.chain((img) =>
      pipe(
        img,
        E.fromPredicate(
          () => img.width > 0 && img.height > 0,
          () =>
            imageValidationErrorResponse(
              `Image has invalid dimensions width: ${img.width} height: ${img.height}`
            )
        )
      )
    )
  );

const uploadImage =
  (blobService: BlobService) =>
  (lowerCaseServiceId: string, bufferImage: Buffer) =>
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
        TE.fromOption(() =>
          ResponseErrorInternal("Error trying to upload image logo on storage")
        )
      ),
      TE.map(() => ResponseSuccessNoContent())
    );

export const makeUploadServiceLogoHandler =
  ({
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
      TE.chainW((_) =>
        pipe(
          bufferImage,
          validateImage,
          TE.fromEither,
          TE.chainW(() =>
            uploadImage(blobService)(lowerCaseServiceId, bufferImage)
          )
        )
      ),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.UploadServiceLogo,
          {
            userSubscriptionId: auth.subscriptionId,
            serviceId,
          }
        )
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
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: IUploadServiceLogoHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddlewareWrapper(
        subscriptionCIDRsModel,
        config
      ),
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
