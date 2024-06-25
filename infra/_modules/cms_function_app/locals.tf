
locals {
  cms = {
    tier          = "standard"
    snet_cidr     = "10.20.8.0/24" # Picked as the first available non-allocated CIDR from the io-p-itn-common-vnet-01
    cosmosdb_name = "db-services-cms"
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = "4"
      NODE_ENV                       = "production"

      // TODO: after migration, update AI implementation and use connection string
      APPINSIGHTS_INSTRUMENTATIONKEY = data.azurerm_application_insights.ai_common.instrumentation_key

      // Keepalive fields are all optionals
      FETCH_KEEPALIVE_ENABLED             = "true"
      FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
      FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
      FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
      FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
      FETCH_KEEPALIVE_TIMEOUT             = "60000"

      # Source data
      COSMOSDB_CONNECTIONSTRING               = format("AccountEndpoint=%s;AccountKey=%s;", data.azurerm_cosmosdb_account.cosmos.endpoint, data.azurerm_cosmosdb_account.cosmos.primary_key)
      COSMOSDB_NAME                           = "db-services-cms"
      COSMOSDB_APP_BE_NAME                    = "app-be"
      COSMOSDB_URI                            = data.azurerm_cosmosdb_account.cosmos.endpoint
      COSMOSDB_KEY                            = data.azurerm_cosmosdb_account.cosmos.primary_key
      COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = "services-lifecycle"
      COSMOSDB_CONTAINER_SERVICES_PUBLICATION = "services-publication"
      COSMOSDB_CONTAINER_SERVICES_HISTORY     = "services-history"
      COSMOSDB_CONTAINER_SERVICES_DETAILS     = "services"

      INTERNAL_STORAGE_CONNECTION_STRING = module.cms_storage_account.primary_connection_string

      # JIRA integration for Service review workflow
      JIRA_NAMESPACE_URL                  = "https://pagopa.atlassian.net"
      JIRA_PROJECT_NAME                   = "IEST"
      JIRA_TOKEN                          = data.azurerm_key_vault_secret.jira_token.value
      JIRA_USERNAME                       = "io-pagopa-github-bot@pagopa.it"
      JIRA_CONTRACT_CUSTOM_FIELD          = "customfield_10365"
      JIRA_DELEGATE_EMAIL_CUSTOM_FIELD    = "customfield_10383"
      JIRA_DELEGATE_NAME_CUSTOM_FIELD     = "customfield_10382"
      JIRA_ORGANIZATION_CF_CUSTOM_FIELD   = "customfield_10364"
      JIRA_ORGANIZATION_NAME_CUSTOM_FIELD = "customfield_10381"
      JIRA_TRANSITION_UPDATED_ID          = "4"

      # JIRA Legacy board
      LEGACY_JIRA_PROJECT_NAME = "IES"

      # Apim connection
      AZURE_APIM                           = "io-p-apim-v2-api"
      AZURE_APIM_RESOURCE_GROUP            = "io-p-rg-internal"
      AZURE_SUBSCRIPTION_ID                = data.azurerm_subscription.current.subscription_id
      AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME = "io-services-api"

      AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
      AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
      AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id

      # PostgreSQL 
      REVIEWER_DB_HOST     = data.azurerm_postgresql_flexible_server.cms_private_pgflex.fqdn
      REVIEWER_DB_NAME     = "reviewer"
      REVIEWER_DB_PASSWORD = data.azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd.value
      REVIEWER_DB_PORT     = 6432
      REVIEWER_DB_SCHEMA   = "reviewer"
      REVIEWER_DB_TABLE    = "service_review"
      REVIEWER_DB_USER     = "reviewerusr"
      TOPIC_DB_SCHEMA      = "taxonomy"
      TOPIC_DB_TABLE       = "topic"

      # Legacy source data
      LEGACY_COSMOSDB_CONNECTIONSTRING                = data.azurerm_key_vault_secret.legacy_cosmosdb_connectionstring.value
      LEGACY_COSMOSDB_NAME                            = "db"
      LEGACY_COSMOSDB_URI                             = data.azurerm_cosmosdb_account.cosmos_legacy.endpoint
      LEGACY_COSMOSDB_KEY                             = data.azurerm_key_vault_secret.legacy_cosmosdb_key.value
      LEGACY_COSMOSDB_CONTAINER_SERVICES              = "services"
      LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE        = "services-cms--legacy-watcher-lease"
      LEGACY_SERVICE_WATCHER_MAX_ITEMS_PER_INVOCATION = 10

      // Internal Storage Account Queues
      # Queues
      REQUEST_REVIEW_QUEUE          = azurerm_storage_queue.request-review.name
      REQUEST_PUBLICATION_QUEUE     = azurerm_storage_queue.request-publication.name
      REQUEST_HISTORICIZATION_QUEUE = azurerm_storage_queue.request-historicization.name
      REQUEST_SYNC_LEGACY_QUEUE     = azurerm_storage_queue.request-sync-legacy.name
      REQUEST_SYNC_CMS_QUEUE        = azurerm_storage_queue.request-sync-cms.name
      REQUEST_REVIEW_LEGACY_QUEUE   = azurerm_storage_queue.request-review-legacy.name
      REQUEST_VALIDATION_QUEUE      = azurerm_storage_queue.request-validation.name
      REQUEST_DELETION_QUEUE        = azurerm_storage_queue.request-deletion.name
      REQUEST_DETAIL_QUEUE          = azurerm_storage_queue.request-detail.name


      # List of service ids for which quality control will be bypassed
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST = data.azurerm_key_vault_secret.serviceid_quality_check_exclusion_list.value

      # UserId List allowed to sync services from CMS to Legacy
      USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST = "*"
      # UserId List allowed to sync services from Legacy to CMS
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST = "*"
      # UserId List allowed to sync JIRA ticket events from Legacy to CMS
      USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST = "*"
      # UserId List allowed to automatic service approval
      USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST = ""

      # External storage account configurations

      # External storage account for assets
      ASSET_STORAGE_CONNECTIONSTRING = data.azurerm_key_vault_secret.asset_storage_connectionstring_secret.value

      # Backoffice Configuration
      BACKOFFICE_INTERNAL_SUBNET_CIDRS = join(",", data.azurerm_subnet.backoffice_app_snet.address_prefixes)

      # Automatic service validation
      MANUAL_REVIEW_PROPERTIES = "data.name,data.description,data.organization.name,data.organization.fiscal_code"

      # Fix Service Review Checker pg module
      APPLICATION_INSIGHTS_NO_PATCH_MODULES = "pg"
    }
    autoscale_settings = {
      min     = 3
      max     = 30
      default = 3
    }
  }
}