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
    COSMOSDB_APP_BE_NAME                    = azurerm_cosmosdb_sql_database.db_app_be.name
    COSMOSDB_URI                            = module.cosmosdb_account.endpoint
    COSMOSDB_KEY                            = module.cosmosdb_account.primary_key
    COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = local.cosmos_containers.services_lifecycle
    COSMOSDB_CONTAINER_SERVICES_PUBLICATION = local.cosmos_containers.services_publication
    COSMOSDB_CONTAINER_SERVICES_HISTORY     = local.cosmos_containers.services_history
    COSMOSDB_CONTAINER_SERVICES_DETAILS     = local.cosmos_containers.services_details

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
    JIRA_TRANSITION_UPDATED_ID          = var.jira_transition_updated_id

    # JIRA Legacy board
    LEGACY_JIRA_PROJECT_NAME = var.legacy_jira_project_name

    # Apim connection
    AZURE_APIM                           = var.azure_apim_v2
    AZURE_APIM_RESOURCE_GROUP            = var.azure_apim_resource_group
    AZURE_SUBSCRIPTION_ID                = data.azurerm_subscription.current.subscription_id
    AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME = var.azure_apim_product_id

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
    REVIEWER_DB_USER     = var.reviewer_db_user
    TOPIC_DB_SCHEMA      = var.topic_db_schema
    TOPIC_DB_TABLE       = var.topic_db_table

    # Legacy source data
    LEGACY_COSMOSDB_CONNECTIONSTRING                = data.azurerm_key_vault_secret.legacy_cosmosdb_connectionstring.value
    LEGACY_COSMOSDB_NAME                            = var.legacy_cosmosdb_name
    LEGACY_COSMOSDB_URI                             = data.azurerm_cosmosdb_account.cosmos_legacy.endpoint
    LEGACY_COSMOSDB_KEY                             = data.azurerm_key_vault_secret.legacy_cosmosdb_key.value
    LEGACY_COSMOSDB_CONTAINER_SERVICES              = var.legacy_cosmosdb_container_services
    LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE        = var.legacy_cosmosdb_container_services_lease
    LEGACY_SERVICE_WATCHER_MAX_ITEMS_PER_INVOCATION = var.legacy_service_watcher_max_items_per_invocation

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
    USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST = var.userid_cms_to_legacy_sync_inclusion_list
    # UserId List allowed to sync services from Legacy to CMS
    USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST = var.userid_legacy_to_cms_sync_inclusion_list
    # UserId List allowed to sync JIRA ticket events from Legacy to CMS
    USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST = var.userid_request_review_legacy_inclusion_list
    # UserId List allowed to automatic service approval
    USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST = var.userid_automatic_service_approval_inclusion_list

    # External storage account configurations

    # External storage account for assets
    ASSET_STORAGE_CONNECTIONSTRING = data.azurerm_key_vault_secret.asset_storage_connectionstring_secret.value

    # Backoffice Configuration
    BACKOFFICE_INTERNAL_SUBNET_CIDRS = join(",", module.backoffice_app_snet.address_prefixes)

    # Automatic service validation
    MANUAL_REVIEW_PROPERTIES = var.manual_review_properties

    # Fix Service Review Checker pg module
    APPLICATION_INSIGHTS_NO_PATCH_MODULES = "pg"
  }
}

module "webapp_functions_app" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//function_app?ref=v7.50.0"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "${local.project}-${local.application_basename}-webapp-fn"
  location            = azurerm_resource_group.rg.location

  health_check_path            = "/api/v1/info"
  health_check_maxpingfailures = 5

  export_keys = true

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
      "AzureWebJobs.LegacyServiceWatcher.Disabled"            = "0"
      "AzureWebJobs.ServiceLifecycleWatcher.Disabled"         = "0"
      "AzureWebJobs.ServicePublicationWatcher.Disabled"       = "0"
      "AzureWebJobs.ServiceReviewChecker.Disabled"            = "0"
      "AzureWebJobs.ServiceHistoryWatcher.Disabled"           = "0"
      "AzureWebJobs.OnRequestHistoricization.Disabled"        = "0"
      "AzureWebJobs.OnRequestPublication.Disabled"            = "0"
      "AzureWebJobs.OnRequestReview.Disabled"                 = "0"
      "AzureWebJobs.OnRequestSyncCms.Disabled"                = "0"
      "AzureWebJobs.OnRequestSyncLegacy.Disabled"             = "0"
      "AzureWebJobs.OnRequestReviewLegacy.Disabled"           = "0"
      "AzureWebJobs.ServiceReviewLegacyChecker.Disabled"      = "0"
      "AzureWebJobs.OnRequestValidation.Disabled"             = "0"
      "AzureWebJobs.OnRequestDeletion.Disabled"               = "0"
      "AzureWebJobs.OnRequestDetail.Disabled"                 = "0"
      "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled"   = "0"
      "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled" = "0"
    }
  )

  sticky_app_setting_names = [
    "AzureWebJobs.LegacyServiceWatcher.Disabled",
    "AzureWebJobs.ServiceLifecycleWatcher.Disabled",
    "AzureWebJobs.ServicePublicationWatcher.Disabled",
    "AzureWebJobs.ServiceReviewChecker.Disabled",
    "AzureWebJobs.ServiceHistoryWatcher.Disabled",
    "AzureWebJobs.OnRequestHistoricization.Disabled",
    "AzureWebJobs.OnRequestPublication.Disabled",
    "AzureWebJobs.OnRequestReview.Disabled",
    "AzureWebJobs.OnRequestSyncCms.Disabled",
    "AzureWebJobs.OnRequestSyncLegacy.Disabled",
    "AzureWebJobs.OnRequestReviewLegacy.Disabled",
    "AzureWebJobs.ServiceReviewLegacyChecker.Disabled",
    "AzureWebJobs.OnRequestValidation.Disabled",
    "AzureWebJobs.OnRequestDeletion.Disabled",
    "AzureWebJobs.OnRequestDetail.Disabled",
    "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled",
    "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled"
  ]

  subnet_id = module.app_snet.id

  allowed_subnets = [
    module.app_snet.id,
    data.azurerm_subnet.apim_v2_snet[0].id,
    module.backoffice_app_snet.id,
    data.azurerm_subnet.devportal_snet.id
  ]

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  action = [{
    action_group_id    = data.azurerm_monitor_action_group.error_action_group.id
    webhook_properties = null
  }]

  tags = var.tags
}

module "webapp_functions_app_staging_slot" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v7.50.0"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "staging"
  location            = azurerm_resource_group.rg.location

  health_check_path            = "/api/v1/info"
  health_check_maxpingfailures = 5

  function_app_id = module.webapp_functions_app.id

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = merge(
    local.webapp_functions_app_settings,
    {
      "AzureWebJobs.LegacyServiceWatcher.Disabled"            = "1"
      "AzureWebJobs.ServiceLifecycleWatcher.Disabled"         = "1"
      "AzureWebJobs.ServicePublicationWatcher.Disabled"       = "1"
      "AzureWebJobs.ServiceReviewChecker.Disabled"            = "1"
      "AzureWebJobs.ServiceHistoryWatcher.Disabled"           = "1"
      "AzureWebJobs.OnRequestHistoricization.Disabled"        = "1"
      "AzureWebJobs.OnRequestPublication.Disabled"            = "1"
      "AzureWebJobs.OnRequestReview.Disabled"                 = "1"
      "AzureWebJobs.OnRequestSyncCms.Disabled"                = "1"
      "AzureWebJobs.OnRequestSyncLegacy.Disabled"             = "1"
      "AzureWebJobs.OnRequestReviewLegacy.Disabled"           = "1"
      "AzureWebJobs.ServiceReviewLegacyChecker.Disabled"      = "1"
      "AzureWebJobs.OnRequestValidation.Disabled"             = "1"
      "AzureWebJobs.OnRequestDeletion.Disabled"               = "1"
      "AzureWebJobs.OnRequestDetail.Disabled"                 = "1"
      "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled"   = "1"
      "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled" = "1"
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
