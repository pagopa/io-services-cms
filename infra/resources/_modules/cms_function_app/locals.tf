
locals {
  queues = [
    { name = "request-review", hasPoison : true },
    { name = "request-publication", hasPoison : true },
    { name = "request-historicization", hasPoison : true },
    { name = "request-sync-legacy", hasPoison : true },
    { name = "request-sync-cms", hasPoison : true },
    { name = "request-review-legacy", hasPoison : true },
    { name = "request-validation", hasPoison : true },
    { name = "request-deletion", hasPoison : true },
    { name = "request-detail", hasPoison : true },
    { name = "request-services-publication-ingestion-retry", hasPoison : true },
    { name = "request-services-lifecycle-ingestion-retry", hasPoison : true },
    { name = "request-services-history-ingestion-retry", hasPoison : true },
    { name = "sync-group-poison" },
    { name = "sync-activations-from-legacy-poison" }
  ]
  containers = {
    "activations" = { name = "activations" }
  }
  cms = {
    tier          = "standard"
    cosmosdb_name = "db-services-cms"
    app_settings = merge({
      NODE_ENV = "production"

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
      COSMOSDB_APP_BE_NAME                    = "app-backend"
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
      AZURE_APIM                           = "io-p-itn-apim-01"
      AZURE_APIM_RESOURCE_GROUP            = "io-p-itn-common-rg-01"
      AZURE_SUBSCRIPTION_ID                = data.azurerm_subscription.current.subscription_id
      AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME = "io-services-api"

      AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
      AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
      AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id

      # PostgreSQL 
      REVIEWER_DB_HOST     = var.pgres_cms_fqdn
      REVIEWER_DB_NAME     = "reviewer"
      REVIEWER_DB_PASSWORD = var.cms_pgres_reviewer_usr_pwd
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
      LEGACY_COSMOSDB_CONTAINER_ACTIVATIONS           = "activations"
      LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE        = "services-cms--legacy-watcher-lease"
      LEGACY_COSMOSDB_CONTAINER_ACTIVATIONS_LEASE     = "activations-sync-lease"
      LEGACY_SERVICE_WATCHER_MAX_ITEMS_PER_INVOCATION = 10

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
      BACKOFFICE_INTERNAL_SUBNET_CIDRS = var.bo_snet_cidr

      # Automatic service validation
      MANUAL_REVIEW_PROPERTIES = "data.name,data.description,data.organization.name,data.organization.fiscal_code,data.metadata.scope"

      #EventHubConfing
      SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING = data.azurerm_key_vault_secret.services_publication_event_hub_connection_string.value
      SERVICES_PUBLICATION_EVENT_HUB_NAME              = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-elt-services-publication-01"
      SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING      = data.azurerm_key_vault_secret.services_topics_event_hub_connection_string.value
      SERVICES_TOPICS_EVENT_HUB_NAME                   = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-elt-services-topic-01"
      SERVICES_LIFECYCLE_EVENT_HUB_NAME                = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-elt-services-lifecycle-01"
      SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING   = data.azurerm_key_vault_secret.services_lifecycle_event_hub_connection_string.value
      SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING     = data.azurerm_key_vault_secret.services_history_event_hub_connection_string.value
      SERVICES_HISTORY_EVENT_HUB_NAME                  = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-elt-services-history-01"
      ACTIVATIONS_EVENT_HUB_CONNECTION_STRING          = data.azurerm_key_vault_secret.activations_event_hub_connection_string.value
      ACTIVATIONS_EVENT_HUB_NAME                       = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-elt-activations-01"

      # Fix Service Review Checker pg module
      APPLICATION_INSIGHTS_NO_PATCH_MODULES = "pg"

      EH_SC_CONNECTIONSTRING         = data.azurerm_key_vault_secret.eh_sc_connectionstring.value
      EH_SC_USERGROUP_NAME           = "sc-usergroups"
      EH_SC_USERGROUP_CONSUMER_GROUP = "io-cms-sync"

      # PDV configurations
      PDV_TOKENIZER_BASE_URL  = "https://api.tokenizer.pdv.pagopa.it"
      PDV_TOKENIZER_BASE_PATH = "/tokenizer/v1"
      PDV_TOKENIZER_API_KEY   = data.azurerm_key_vault_secret.pdv_tokenizer_api_key.value

      # Blob Storage configurations
      STORAGE_ACCOUNT_NAME       = module.cms_storage_account.name
      ACTIVATIONS_CONTAINER_NAME = local.containers.activations.name
      }, {
      // Queues
      for queue in local.queues : "${replace(upper(queue.name), "-", "_")}_QUEUE" => queue.name
    })

    autoscale_settings = {
      min     = 3
      max     = 30
      default = 3
    }
  }
}
