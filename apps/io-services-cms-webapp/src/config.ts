/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import { HttpAgentConfig } from "@io-services-cms/fetch-utils";
import { ServiceLifecycle } from "@io-services-cms/models";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import {
  IntegerFromString,
  NonNegativeInteger,
  NumberFromString,
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { FiscalCode } from "./generated/api/FiscalCode";
import { CommaSeparatedListOf } from "./utils/comma-separated-list";
import {
  PrefixCfTestArrayDecoder,
  TestFiscalCodesUsersDecoder,
} from "./utils/filter-test-user";

// used for internal job dispatch, temporary files, etc...
const InternalStorageAccount = t.type({
  INTERNAL_STORAGE_CONNECTION_STRING: NonEmptyString,
});

const ManagedIdentityFlag = withDefault(BooleanFromString, true);

const ManagedIdentitySettings = {
  CMS_COSMOSDB__accountEndpoint: NonEmptyString,
  CMS_INTERNAL_STORAGE__blobServiceUri: NonEmptyString,
  CMS_INTERNAL_STORAGE__queueServiceUri: NonEmptyString,
  CMS_LEGACY_COSMOSDB__accountEndpoint: NonEmptyString,
  SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE: NonEmptyString,
};

const ManagedIdentityOptionalSettings = t.partial(ManagedIdentitySettings);
const ManagedIdentityRequiredSettings = t.type(ManagedIdentitySettings);

// Keep fallback secrets in the schema during the rollout so deployed apps can
// switch back via USE_MANAGED_IDENTITY=false and local/emulator setups can
// still boot with connection strings.
const FallbackSettings = {
  ACTIVATIONS_EVENT_HUB_CONNECTION_STRING: NonEmptyString,
  COSMOSDB_CONNECTIONSTRING: NonEmptyString,
  COSMOSDB_KEY: NonEmptyString,
  LEGACY_COSMOSDB_CONNECTIONSTRING: NonEmptyString,
  LEGACY_COSMOSDB_KEY: NonEmptyString,
  SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING: NonEmptyString,
  SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING: NonEmptyString,
  SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING: NonEmptyString,
  SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING: NonEmptyString,
};

const FallbackOptionalSettings = t.partial(FallbackSettings);
const FallbackRequiredSettings = t.type(FallbackSettings);

type ManagedIdentityOptionalConfiguration = t.TypeOf<
  typeof ManagedIdentityOptionalSettings
>;
type ManagedIdentityRequiredConfiguration = t.TypeOf<
  typeof ManagedIdentityRequiredSettings
>;
type FallbackOptionalConfiguration = t.TypeOf<typeof FallbackOptionalSettings>;
type FallbackRequiredConfiguration = t.TypeOf<typeof FallbackRequiredSettings>;

export type RuntimeModeDisabledConfiguration = {
  USE_MANAGED_IDENTITY: false;
} & FallbackRequiredConfiguration &
  ManagedIdentityOptionalConfiguration;

export type RuntimeModeEnabledConfiguration = {
  USE_MANAGED_IDENTITY: true;
} & FallbackOptionalConfiguration &
  ManagedIdentityRequiredConfiguration;

// Keep the runtime contract explicit: connection-string mode requires fallback
// secrets, while managed-identity mode requires only the MI-specific settings.
const RuntimeModeDisabledSettings = t.intersection([
  ManagedIdentityOptionalSettings,
  FallbackRequiredSettings,
]);

const RuntimeModeEnabledSettings = t.intersection([
  ManagedIdentityRequiredSettings,
  FallbackOptionalSettings,
]);

const getInputProperty = (input: unknown, key: string): unknown =>
  typeof input === "object" && input !== null
    ? Reflect.get(input, key)
    : undefined;

const RuntimeModeConfigurationCodec: t.Type<
  RuntimeModeDisabledConfiguration | RuntimeModeEnabledConfiguration,
  RuntimeModeDisabledConfiguration | RuntimeModeEnabledConfiguration,
  unknown
> = new t.Type(
  "RuntimeModeConfiguration",
  (
    input,
  ): input is
    | RuntimeModeDisabledConfiguration
    | RuntimeModeEnabledConfiguration =>
    typeof input === "object" && input !== null,
  (input, context) => {
    const useManagedIdentityOrErrors = ManagedIdentityFlag.validate(
      getInputProperty(input, "USE_MANAGED_IDENTITY"),
      context,
    );

    if (E.isLeft(useManagedIdentityOrErrors)) {
      return useManagedIdentityOrErrors;
    }

    return useManagedIdentityOrErrors.right
      ? pipe(
          RuntimeModeEnabledSettings.validate(input, context),
          E.map(
            (settings): RuntimeModeEnabledConfiguration => ({
              ...settings,
              USE_MANAGED_IDENTITY: true,
            }),
          ),
        )
      : pipe(
          RuntimeModeDisabledSettings.validate(input, context),
          E.map(
            (settings): RuntimeModeDisabledConfiguration => ({
              ...settings,
              USE_MANAGED_IDENTITY: false,
            }),
          ),
        );
  },
  t.identity,
);

export type RuntimeModeConfiguration = t.TypeOf<
  typeof RuntimeModeConfigurationCodec
>;

export const RuntimeModeConfiguration = RuntimeModeConfigurationCodec;

export type ManagedIdentityConfiguration = {
  USE_MANAGED_IDENTITY: true;
} & ManagedIdentityRequiredConfiguration;

const ServicePayloadConfig = t.type({
  MAX_ALLOWED_PAYMENT_AMOUNT: withDefault(
    IntegerFromString.pipe(ServiceLifecycle.definitions.MaxAllowedAmount),
    "1000000" as unknown as ServiceLifecycle.definitions.MaxAllowedAmount,
  ),
  SANDBOX_FISCAL_CODE: withDefault(
    FiscalCode,
    "AAAAAA00A00A000A" as FiscalCode,
  ),
});

// Jira configuration
export const JiraConfig = t.type({
  JIRA_CONTRACT_CUSTOM_FIELD: NonEmptyString,
  JIRA_DELEGATE_EMAIL_CUSTOM_FIELD: NonEmptyString,
  JIRA_DELEGATE_NAME_CUSTOM_FIELD: NonEmptyString,
  JIRA_ISSUE_HIGH_PRIORITY_ID: withDefault(
    NonEmptyString,
    "2" as NonEmptyString,
  ),
  JIRA_ISSUE_MEDIUM_PRIORITY_ID: withDefault(
    NonEmptyString,
    "3" as NonEmptyString,
  ),
  JIRA_NAMESPACE_URL: NonEmptyString,
  JIRA_ORGANIZATION_CF_CUSTOM_FIELD: NonEmptyString,
  JIRA_ORGANIZATION_NAME_CUSTOM_FIELD: NonEmptyString,
  JIRA_PROJECT_NAME: NonEmptyString,
  JIRA_TOKEN: NonEmptyString,
  JIRA_TRANSITION_UPDATED_ID: NonEmptyString,
  JIRA_USERNAME: EmailAddress,
});
export type JiraConfig = t.TypeOf<typeof JiraConfig>;

// Jira Legacy board
export const JiraLegacyProjectName = t.type({
  LEGACY_JIRA_PROJECT_NAME: NonEmptyString,
});

export type PostgreSqlConfig = t.TypeOf<typeof PostgreSqlConfig>;
export const PostgreSqlConfig = t.type({
  REVIEWER_DB_APP_NAME: withDefault(
    NonEmptyString,
    "reviewer" as NonEmptyString,
  ),
  REVIEWER_DB_HOST: NonEmptyString,
  REVIEWER_DB_IDLE_TIMEOUT: withDefault(
    NumberFromString,
    "30000" as unknown as number,
  ),
  REVIEWER_DB_NAME: NonEmptyString,
  REVIEWER_DB_PASSWORD: NonEmptyString,
  REVIEWER_DB_PORT: NumberFromString,
  REVIEWER_DB_READ_MAX_ROW: withDefault(
    IntegerFromString,
    "50" as unknown as number,
  ),
  REVIEWER_DB_USER: NonEmptyString,
});

export type ReviewerPostgreSqlConfig = t.TypeOf<
  typeof ReviewerPostgreSqlConfig
>;
export const ReviewerPostgreSqlConfig = t.intersection([
  PostgreSqlConfig,
  t.type({
    REVIEWER_DB_SCHEMA: NonEmptyString,
    REVIEWER_DB_TABLE: NonEmptyString,
  }),
]);

export type TopicPostgreSqlConfig = t.TypeOf<typeof TopicPostgreSqlConfig>;
export const TopicPostgreSqlConfig = t.intersection([
  PostgreSqlConfig,
  t.type({
    TOPIC_DB_SCHEMA: NonEmptyString,
    TOPIC_DB_TABLE: NonEmptyString,
  }),
]);

const CosmosBaseConfig = t.type({
  COSMOSDB_APP_BE_NAME: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_DETAILS: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_HISTORY: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_PUBLICATION: NonEmptyString,
  COSMOSDB_NAME: NonEmptyString,
  COSMOSDB_URI: NonEmptyString,
});

export type CosmosConfig = Pick<
  FallbackRequiredConfiguration,
  "COSMOSDB_CONNECTIONSTRING" | "COSMOSDB_KEY"
> &
  t.TypeOf<typeof CosmosBaseConfig>;
export const CosmosConfig = CosmosBaseConfig;

export type ManagedIdentityCosmosConfiguration =
  RuntimeModeEnabledConfiguration & t.TypeOf<typeof CosmosBaseConfig>;

export type FallbackCosmosConfiguration = CosmosConfig &
  RuntimeModeDisabledConfiguration;

export type CosmosDatabaseConfiguration =
  | FallbackCosmosConfiguration
  | ManagedIdentityCosmosConfiguration;

const CosmosLegacyBaseConfig = t.type({
  LEGACY_COSMOSDB_CONTAINER_SERVICES: NonEmptyString,
  LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE: NonEmptyString,
  LEGACY_COSMOSDB_NAME: NonEmptyString,
  LEGACY_COSMOSDB_URI: NonEmptyString,
  LEGACY_SERVICE_WATCHER_MAX_ITEMS_PER_INVOCATION: NumberFromString,
});

export type CosmosLegacyConfig = Pick<
  FallbackRequiredConfiguration,
  "LEGACY_COSMOSDB_CONNECTIONSTRING" | "LEGACY_COSMOSDB_KEY"
> &
  t.TypeOf<typeof CosmosLegacyBaseConfig>;
export const CosmosLegacyConfig = CosmosLegacyBaseConfig;

export type ManagedIdentityLegacyCosmosConfiguration =
  RuntimeModeEnabledConfiguration & t.TypeOf<typeof CosmosLegacyBaseConfig>;

export type FallbackLegacyCosmosConfiguration = CosmosLegacyConfig &
  RuntimeModeDisabledConfiguration;

export type LegacyCosmosConfiguration =
  | FallbackLegacyCosmosConfiguration
  | ManagedIdentityLegacyCosmosConfiguration;

// Apim configuration
export const ApimConfig = t.type({
  APIM_USER_GROUPS: NonEmptyString,
  AZURE_APIM: NonEmptyString,
  AZURE_APIM_RESOURCE_GROUP: NonEmptyString,
  AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME: NonEmptyString,
  AZURE_SUBSCRIPTION_ID: NonEmptyString,
});
export type ApimConfig = t.TypeOf<typeof ApimConfig>;

// Queue configuration
export const QueueConfig = t.type({
  REQUEST_DETAIL_QUEUE: NonEmptyString,
  REQUEST_HISTORICIZATION_QUEUE: NonEmptyString,
  REQUEST_PUBLICATION_QUEUE: NonEmptyString,
  REQUEST_REVIEW_LEGACY_QUEUE: NonEmptyString,
  REQUEST_REVIEW_QUEUE: NonEmptyString,
  REQUEST_SYNC_CMS_QUEUE: NonEmptyString,
  REQUEST_SYNC_LEGACY_QUEUE: NonEmptyString,
  REQUEST_VALIDATION_QUEUE: NonEmptyString,
});
export type QueueConfig = t.TypeOf<typeof QueueConfig>;

// Application Insight configuration
export const ApplicationInsightConfig = t.type({
  APPLICATIONINSIGHTS_CONNECTION_STRING: NonEmptyString,
});

// Services pagination configuration
export const PaginationConfig = t.type({
  PAGINATION_DEFAULT_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "20" as unknown as NonNegativeInteger,
  ),
  PAGINATION_MAX_LIMIT: withDefault(
    IntegerFromString.pipe(NonNegativeInteger),
    "100" as unknown as NonNegativeInteger,
  ),
});
export type PaginationConfig = t.TypeOf<typeof PaginationConfig>;

// List of service ids for which quality control will be bypassed
const ServiceIdQualityCheckExclusionList = t.type({
  SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: withDefault(
    CommaSeparatedListOf(ServiceLifecycle.definitions.ServiceId),
    [],
  ),
});

const FeatureFlags = t.type({
  /**
   * Enables exposing the `suitable_for_minors` field in services API responses.
   * Defaults to `false` (field omitted) to preserve backward compatibility for
   * external read consumers. Toggle via app setting, no code deploy needed.
   */
  FF_SUITABLE_FOR_MINORS_ENABLED: withDefault(
    BooleanFromString,
    "false" as unknown as boolean,
  ),
  // UserId List allowed to automatic service approval
  USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST: withDefault(
    CommaSeparatedListOf(NonEmptyString),
    [],
  ),
  /**
   * UserId List allowed to sync services from CMS to Legacy
   * @deprecated this feature flag will be removed in future releases
   */
  USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: withDefault(
    CommaSeparatedListOf(NonEmptyString),
    [],
  ),
  /**
   * UserId List allowed to sync services from CMS to Legacy
   * @deprecated this feature flag will be removed in future releases
   */
  USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: withDefault(
    CommaSeparatedListOf(NonEmptyString),
    [],
  ),
  /**
   * UserId List allowed to sync JIRA ticket events from Legacy to CMS
   * @deprecated this feature flag will be removed in future releases
   */
  USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST: withDefault(
    CommaSeparatedListOf(NonEmptyString),
    [],
  ),
});

export const ExternalStorageAccountConfiguration = t.type({
  ASSET_STORAGE_CONNECTIONSTRING: NonEmptyString,
});
export type ExternalStorageAccountConfiguration = t.TypeOf<
  typeof ExternalStorageAccountConfiguration
>;

export const BackofficeInternalSubnetCIDRs = t.type({
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: CommaSeparatedListOf(CIDR),
});
export type BackofficeInternalSubnetCIDRs = t.TypeOf<
  typeof BackofficeInternalSubnetCIDRs
>;

export const ServiceValidationConfig = t.type({
  MANUAL_REVIEW_PROPERTIES: CommaSeparatedListOf(NonEmptyString),
});
export type ServiceValidationConfig = t.TypeOf<typeof ServiceValidationConfig>;

// Default Application Values
const DefaultValues = t.type({
  DEFAULT_PAGED_FETCH_LIMIT: withDefault(
    NumberFromString,
    "10" as unknown as number,
  ),
  // Default Topic ID for services on legacy -> CMS sync
  LEGACY_SYNC_DEFAULT_TOPIC_ID: withDefault(
    NumberFromString,
    "0" as unknown as number,
  ),
});

const ServicesPublicationEventHubBaseConfig = t.type({
  SERVICES_PUBLICATION_EVENT_HUB_NAME: NonEmptyString,
});

export type ServicesPublicationEventHubConfig = Pick<
  FallbackRequiredConfiguration,
  "SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING"
> &
  t.TypeOf<typeof ServicesPublicationEventHubBaseConfig>;
export const ServicesPublicationEventHubConfig =
  ServicesPublicationEventHubBaseConfig;

const ServicesTopicsEventHubBaseConfig = t.type({
  SERVICES_TOPICS_EVENT_HUB_NAME: NonEmptyString,
});

export type ServicesTopicsEventHubConfig = Pick<
  FallbackRequiredConfiguration,
  "SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING"
> &
  t.TypeOf<typeof ServicesTopicsEventHubBaseConfig>;
export const ServicesTopicsEventHubConfig = ServicesTopicsEventHubBaseConfig;

const ServicesLifecycleEventHubBaseConfig = t.type({
  SERVICES_LIFECYCLE_EVENT_HUB_NAME: NonEmptyString,
});

export type ServicesLifecycleEventHubConfig = Pick<
  FallbackRequiredConfiguration,
  "SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING"
> &
  t.TypeOf<typeof ServicesLifecycleEventHubBaseConfig>;
export const ServicesLifecycleEventHubConfig =
  ServicesLifecycleEventHubBaseConfig;

const ServicesHistoryEventHubBaseConfig = t.type({
  SERVICES_HISTORY_EVENT_HUB_NAME: NonEmptyString,
});

export type ServicesHistoryEventHubConfig = Pick<
  FallbackRequiredConfiguration,
  "SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING"
> &
  t.TypeOf<typeof ServicesHistoryEventHubBaseConfig>;
export const ServicesHistoryEventHubConfig = ServicesHistoryEventHubBaseConfig;

const ActivationEventHubBaseConfig = t.type({
  ACTIVATIONS_EVENT_HUB_NAME: NonEmptyString,
});

export type ActivationEventHubConfig = Pick<
  FallbackRequiredConfiguration,
  "ACTIVATIONS_EVENT_HUB_CONNECTION_STRING"
> &
  t.TypeOf<typeof ActivationEventHubBaseConfig>;
export const ActivationEventHubConfig = ActivationEventHubBaseConfig;

//PDV tokenizer client configuration
export type PDVTokenizerClientConfiguration = t.TypeOf<
  typeof PDVTokenizerClientConfiguration
>;
export const PDVTokenizerClientConfiguration = t.type({
  PDV_TOKENIZER_API_KEY: NonEmptyString,
  PDV_TOKENIZER_BASE_PATH: NonEmptyString,
  PDV_TOKENIZER_BASE_URL: NonEmptyString,
});

export const BlobStorageClientConfiguration = t.type({
  ACTIVATIONS_CONTAINER_NAME: NonEmptyString,
  STORAGE_ACCOUNT_NAME: NonEmptyString,
});
export type BlobStorageClientConfiguration = t.TypeOf<
  typeof BlobStorageClientConfiguration
>;

const TestFiscalCodeConfiguration = t.type({
  PREFIX_CF_TEST: PrefixCfTestArrayDecoder,
  TEST_FISCAL_CODES: TestFiscalCodesUsersDecoder,
});

export type TestFiscalCodeConfiguration = t.TypeOf<
  typeof TestFiscalCodeConfiguration
>;

export type SelfcareClientConfig = t.TypeOf<typeof SelfcareClientConfig>;
export const SelfcareClientConfig = t.intersection([
  t.type({
    SELFCARE_API_KEY: NonEmptyString,
    SELFCARE_EXTERNAL_API_BASE_URL: NonEmptyString,
  }),
  t.type({
    APIM_USER_GROUPS: CommaSeparatedListOf(NonEmptyString),
  }),
  HttpAgentConfig,
]);

const SharedConfiguration = t.intersection([
  t.intersection([
    t.intersection([
      t.intersection([
        t.type({ isProduction: t.boolean }),
        InternalStorageAccount,
      ]),
      t.intersection([
        JiraConfig,
        ReviewerPostgreSqlConfig,
        ServicePayloadConfig,
      ]),
    ]),
    t.intersection([
      CosmosBaseConfig,
      ApimConfig,
      QueueConfig,
      ServiceIdQualityCheckExclusionList,
      SelfcareClientConfig,
    ]),
    t.intersection([
      CosmosLegacyBaseConfig,
      PaginationConfig,
      JiraLegacyProjectName,
      ApplicationInsightConfig,
      FeatureFlags,
    ]),
    t.intersection([
      ExternalStorageAccountConfiguration,
      BackofficeInternalSubnetCIDRs,
      TopicPostgreSqlConfig,
      ServiceValidationConfig,
      DefaultValues,
    ]),
    t.intersection([
      ServicesPublicationEventHubBaseConfig,
      ServicesTopicsEventHubBaseConfig,
      ServicesLifecycleEventHubBaseConfig,
      ServicesHistoryEventHubBaseConfig,
    ]),
  ]),
  t.intersection([
    PDVTokenizerClientConfiguration,
    ActivationEventHubBaseConfig,
    HttpAgentConfig,
    BlobStorageClientConfiguration,
    TestFiscalCodeConfiguration,
  ]),
]);

type SharedConfiguration = t.TypeOf<typeof SharedConfiguration>;

const ManagedIdentityAppConfigurationSettings = t.intersection([
  SharedConfiguration,
  RuntimeModeEnabledSettings,
]);

const FallbackAppConfigurationSettings = t.intersection([
  SharedConfiguration,
  RuntimeModeDisabledSettings,
]);

export type ManagedIdentityAppConfiguration = RuntimeModeEnabledConfiguration &
  SharedConfiguration;
export type FallbackAppConfiguration = RuntimeModeDisabledConfiguration &
  SharedConfiguration;

const IConfigCodec: t.Type<
  FallbackAppConfiguration | ManagedIdentityAppConfiguration,
  FallbackAppConfiguration | ManagedIdentityAppConfiguration,
  unknown
> = new t.Type(
  "IConfig",
  (
    input,
  ): input is FallbackAppConfiguration | ManagedIdentityAppConfiguration =>
    typeof input === "object" && input !== null,
  (input, context) => {
    const runtimeModeConfigurationOrErrors = RuntimeModeConfiguration.validate(
      input,
      context,
    );

    if (E.isLeft(runtimeModeConfigurationOrErrors)) {
      return runtimeModeConfigurationOrErrors;
    }

    return runtimeModeConfigurationOrErrors.right.USE_MANAGED_IDENTITY
      ? pipe(
          ManagedIdentityAppConfigurationSettings.validate(input, context),
          E.map(
            (settings): ManagedIdentityAppConfiguration => ({
              ...settings,
              USE_MANAGED_IDENTITY: true,
            }),
          ),
        )
      : pipe(
          FallbackAppConfigurationSettings.validate(input, context),
          E.map(
            (settings): FallbackAppConfiguration => ({
              ...settings,
              USE_MANAGED_IDENTITY: false,
            }),
          ),
        );
  },
  t.identity,
);

// Global app configuration
export type IConfig = t.TypeOf<typeof IConfigCodec>;
export const IConfig = IConfigCodec;

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === "production",
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    }),
  );
