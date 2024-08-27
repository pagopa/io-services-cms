import { ServiceLifecycle } from "@io-services-cms/models";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import { RequiredQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_query_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { CosmosHelper } from "../../utils/cosmos-helper";
import { ErrorResponseTypes } from "../../utils/logger";
// FIXME: This Handler is TEMPORARY and will be removed after the old Developer Portal will be decommissioned

type CheckResult = {
  service_id?: NonEmptyString;
  is_duplicate: boolean;
};

type Dependencies = {
  servicePublicationCosmosHelper: CosmosHelper;
  serviceLifecycleCosmosHelper: CosmosHelper;
  telemetryClient: TelemetryClient;
};

type HandlerResponseTypes =
  | IResponseSuccessJson<CheckResult>
  | ErrorResponseTypes;

type CheckServiceDuplicationInternalHandler = (
  organizationFiscalCode: NonEmptyString,
  serviceName: NonEmptyString,
  serviceId: O.Option<ServiceLifecycle.definitions.ServiceId>
) => Promise<HandlerResponseTypes>;

export const makeCheckServiceDuplicationInternalHandler =
  ({
    servicePublicationCosmosHelper,
    serviceLifecycleCosmosHelper,
    telemetryClient,
  }: Dependencies): CheckServiceDuplicationInternalHandler =>
  (serviceName, organizationFiscalCode, newServiceId) =>
    pipe(
      // Get Duplicate Services
      getDuplicatesOnServicePublication(servicePublicationCosmosHelper)(
        serviceName,
        organizationFiscalCode,
        newServiceId
      ),
      TE.chainW((publicationQueryResult) =>
        pipe(
          publicationQueryResult,
          O.fold(
            () => TE.right({ is_duplicate: false }),
            (publicationResult) =>
              pipe(
                // Check if duplicates found are not related to deleted service
                getNotDeletedDuplicatesOnServiceLifecycle(
                  serviceLifecycleCosmosHelper
                )(publicationResult),
                TE.chainW((lifecycleQueryResult) =>
                  pipe(
                    lifecycleQueryResult,
                    O.fold(
                      // No active duplicates found
                      () => ({ is_duplicate: false }),
                      (lifecycleResult) =>
                        // found duplicated not related to deleted service
                        ({
                          is_duplicate: true,
                          service_id: lifecycleResult,
                        })
                    ),
                    TE.right
                  )
                )
              )
          )
        )
      ),
      TE.map((resp) => ResponseSuccessJson(resp)),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.CheckServiceDuplicationInternal,
          {
            serviceName,
          }
        )
      ),
      TE.mapLeft((err) =>
        ResponseErrorInternal(`An Error has occurred: ${err.message}`)
      ),
      TE.toUnion
    )();

const getDuplicatesOnServicePublication =
  (servicePublicationCosmosHelper: CosmosHelper) =>
  (
    serviceName: NonEmptyString,
    organizationFiscalCode: NonEmptyString,
    newServiceId: O.Option<ServiceLifecycle.definitions.ServiceId>
  ) => {
    const baseQuery = `SELECT VALUE c.id FROM c WHERE STRINGEQUALS(c.data.name, @serviceName, true) AND c.data.organization.fiscal_code = @organizationFiscalCode`;

    const query = O.isSome(newServiceId)
      ? `${baseQuery} AND c.id != @newServiceId`
      : baseQuery;

    const baseQueryParameters = [
      {
        name: "@serviceName",
        value: serviceName,
      },
      {
        name: "@organizationFiscalCode",
        value: organizationFiscalCode,
      },
    ];

    const queryParameters = O.isSome(newServiceId)
      ? [
          ...baseQueryParameters,
          {
            name: "@newServiceId",
            value: newServiceId.value,
          },
        ]
      : baseQueryParameters;

    return servicePublicationCosmosHelper.fetchItems(
      {
        query,
        parameters: queryParameters,
      },
      NonEmptyString
    );
  };

const getNotDeletedDuplicatesOnServiceLifecycle =
  (serviceLifecycleCosmosHelper: CosmosHelper) =>
  (serviceIds: ReadonlyArray<NonEmptyString>) => {
    const query = `SELECT VALUE c.id FROM c WHERE c.id IN ('${serviceIds.join(
      "', '"
    )}') AND c.fsm.state != 'deleted'`;

    return serviceLifecycleCosmosHelper.fetchSingleItem(
      {
        query,
      },
      NonEmptyString
    );
  };

export const applyRequestMiddelwares = (
  handler: CheckServiceDuplicationInternalHandler
) => {
  const middlewaresWrap = withRequestMiddlewares(
    RequiredQueryParamMiddleware("serviceName", NonEmptyString),
    RequiredQueryParamMiddleware("organizationFiscalCode", NonEmptyString),
    OptionalQueryParamMiddleware("serviceId", NonEmptyString)
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
