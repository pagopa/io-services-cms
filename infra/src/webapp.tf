#
# Variables
#
variable "functions_kind" {
  type        = string
  description = "App service plan kind"
  default     = null
}

variable "functions_sku_tier" {
  type        = string
  description = "App service plan sku tier"
  default     = null
}

variable "functions_sku_size" {
  type        = string
  description = "App service plan sku size"
  default     = null
}

variable "functions_autoscale_minimum" {
  type        = number
  description = "The minimum number of instances for this resource."
  default     = 1
}

variable "functions_autoscale_maximum" {
  type        = number
  description = "The maximum number of instances for this resource."
  default     = 30
}

variable "functions_autoscale_default" {
  type        = number
  description = "The number of instances that are available for scaling if metrics are not available for evaluation."
  default     = 1
}

variable "jira_namespace_url" {
  type        = string
  description = ""
  default     = null
}

variable "jira_project_name" {
  type        = string
  description = ""
  default     = null
}

variable "jira_username" {
  type        = string
  description = ""
  default     = null
}

variable "jira_contract_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_delegate_email_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_delegate_name_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_organization_cf_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_organization_name_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "azure_apim" {
  type        = string
  description = ""
  default     = null
}

variable "azure_apim_resource_group" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_name" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_schema" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_table" {
  type        = string
  description = ""
  default     = null
}

#
# Function app definition
#

locals {
  webapp_functions_app_settings = {
    FUNCTIONS_WORKER_RUNTIME       = "node"
    FUNCTIONS_WORKER_PROCESS_COUNT = "4"
    NODE_ENV                       = "production"

    // Keepalive fields are all optionals
    FETCH_KEEPALIVE_ENABLED             = "true"
    FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
    FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
    FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
    FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
    FETCH_KEEPALIVE_TIMEOUT             = "60000"

    # Source data
    COSMOSDB_CONNECTIONSTRING               = format("AccountEndpoint=%s;AccountKey=%s;", module.cosmosdb_account.endpoint, module.cosmosdb_account.primary_key)
    COSMOSDB_NAME                           = azurerm_cosmosdb_sql_database.db_cms.name
    COSMOSDB_URI                            = module.cosmosdb_account.endpoint
    COSMOSDB_KEY                            = module.cosmosdb_account.primary_key
    COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = local.cosmos_containers.services_lifecycle
    COSMOSDB_CONTAINER_SERVICES_PUBLICATION = local.cosmos_containers.services_publication
    COSMOSDB_CONTAINER_SERVICES_HISTORY     = local.cosmos_containers.services_history

    INTERNAL_STORAGE_CONNECTION_STRING = module.storage_account.primary_connection_string

    # JIRA integration for Service review workflow
    JIRA_NAMESPACE_URL                  = var.jira_namespace_url
    JIRA_PROJECT_NAME                   = var.jira_project_name
    JIRA_TOKEN                          = data.azurerm_key_vault_secret.jira_token.value
    JIRA_USERNAME                       = var.jira_username
    JIRA_CONTRACT_CUSTOM_FIELD          = var.jira_contract_custom_field
    JIRA_DELEGATE_EMAIL_CUSTOM_FIELD    = var.jira_delegate_email_custom_field
    JIRA_DELEGATE_NAME_CUSTOM_FIELD     = var.jira_delegate_name_custom_field
    JIRA_ORGANIZATION_CF_CUSTOM_FIELD   = var.jira_organization_cf_custom_field
    JIRA_ORGANIZATION_NAME_CUSTOM_FIELD = var.jira_organization_name_custom_field

    # Apim connection
    AZURE_APIM                = var.azure_apim
    AZURE_APIM_RESOURCE_GROUP = var.azure_apim_resource_group
    AZURE_SUBSCRIPTION_ID     = data.azurerm_subscription.current.subscription_id

    AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
    AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
    AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id

    # PostgreSQL 
    REVIEWER_DB_HOST     = module.postgres_flexible_server_private.fqdn
    REVIEWER_DB_NAME     = var.reviewer_db_name
    REVIEWER_DB_PASSWORD = azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd.value
    REVIEWER_DB_PORT     = module.postgres_flexible_server_private.connection_port
    REVIEWER_DB_SCHEMA   = var.reviewer_db_schema
    REVIEWER_DB_TABLE    = var.reviewer_db_table
    REVIEWER_DB_USER     = module.postgres_flexible_server_private.administrator_login

    # Legacy data
    LEGACY_COSMOSDB_CONNECTIONSTRING          = data.azurerm_key_vault_secret.legacy_cosmosdb_connectionstring.value
    LEGACY_COSMOSDB_NAME                      = var.legacy_cosmosdb_name
    LEGACY_COSMOSDB_SERVICES_COLLECTION       = var.legacy_cosmosdb_services_collection
    LEGACY_COSMOSDB_SERVICES_LEASE_COLLECTION = var.legacy_cosmosdb_services_lease_collection

    # Queues
    REQUEST_REVIEW_QUEUE          = azurerm_storage_queue.request-review.name
    REQUEST_PUBLICATION_QUEUE     = azurerm_storage_queue.request-publication.name
    REQUEST_HISTORICIZATION_QUEUE = azurerm_storage_queue.request-historicization.name

    # Disable functions
    "AzureWebJobs.ServiceReviewChecker.Disabled" = "1"
  }
}

module "webapp_functions_app" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app?ref=v6.19.1"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "${local.project}-${local.application_basename}-webapp-fn"
  location            = var.location
  health_check_path   = "/api/v1/info"

  app_service_plan_info = {
    kind                         = var.functions_kind
    sku_tier                     = var.functions_sku_tier
    sku_size                     = var.functions_sku_size
    zone_balancing_enabled       = false
    worker_count                 = 1
    maximum_elastic_worker_count = 0
  }

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = merge(
    local.webapp_functions_app_settings,
    {
      "AzureWebJobs.OnLegacyServiceChange.Disabled" = "1"
      "ServiceLifecycleWatcher.Disabled"            = "0"
      "ServicePublicationWatcher.Disabled"          = "0"
      "ServiceReviewChecker.Disabled"               = "0"
    }
  )

  sticky_app_setting_names = [
    "AzureWebJobs.OnLegacyServiceChange.Disabled",
    "ServiceLifecycleWatcher.Disabled",
    "ServicePublicationWatcher.Disabled",
    "ServiceReviewChecker.Disabled",
  ]

  subnet_id = module.app_snet.id

  allowed_subnets = [module.app_snet.id]

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  tags = var.tags
}


module "webapp_functions_app_staging_slot" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v6.19.1"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "staging"
  location            = var.location
  health_check_path   = "/api/v1/info"

  function_app_id = module.webapp_functions_app.id

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = merge(
    local.webapp_functions_app_settings,
    {
      "AzureWebJobs.OnLegacyServiceChange.Disabled" = "1"
      "ServiceLifecycleWatcher.Disabled"            = "1"
      "ServicePublicationWatcher.Disabled"          = "1"
      "ServiceReviewChecker.Disabled"               = "1"
    }
  )

  storage_account_name       = module.webapp_functions_app.storage_account.name
  storage_account_access_key = module.webapp_functions_app.storage_account.primary_access_key

  subnet_id = module.app_snet.id

  allowed_subnets = [
    module.app_snet.id,
    local.is_prod ? data.azurerm_subnet.github_runner_subnet[0].id : null
  ]

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  tags = var.tags
}
