locals {
  backoffice_node_version      = "18-lts"
  backoffice_health_check_path = "/api/info"
  backoffice_app_settings = merge({
    NODE_ENV                 = "production"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    BACKOFFICE_HOST          = var.backoffice_host
    # Azure
    AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
    AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
    AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id
    # Apim connection
    AZURE_SUBSCRIPTION_ID     = data.azurerm_subscription.current.subscription_id
    AZURE_APIM                = data.azurerm_api_management.apim_v2.name
    AZURE_APIM_RESOURCE_GROUP = data.azurerm_api_management.apim_v2.resource_group_name
    AZURE_APIM_PRODUCT_NAME   = data.azurerm_api_management_product.apim_v2_product_services.product_id
    APIM_USER_GROUPS          = var.backoffice_app.apim_user_groups
    API_APIM_MOCKING          = true
    # Logs
    AI_SDK_CONNECTION_STRING = data.azurerm_application_insights.application_insights.connection_string
    # NextAuthJS
    NEXTAUTH_URL    = "https://${var.backoffice_host}/" # FIXME: move into terraform.tfvars or use a terraform resource/data ref
    NEXTAUTH_SECRET = azurerm_key_vault_secret.bo_auth_session_secret.value

    # Legacy source data
    LEGACY_COSMOSDB_NAME    = var.legacy_cosmosdb_name
    LEGACY_COSMOSDB_URI     = data.azurerm_cosmosdb_account.cosmos_legacy.endpoint
    LEGACY_COSMOSDB_KEY     = data.azurerm_key_vault_secret.legacy_cosmosdb_key.value
    LEGACY_COSMOSDB_MOCKING = true

    # Services CMS source data
    COSMOSDB_NAME                           = azurerm_cosmosdb_sql_database.db_cms.name
    COSMOSDB_URI                            = module.cosmosdb_account.endpoint
    COSMOSDB_KEY                            = module.cosmosdb_account.primary_key
    COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = local.cosmos_containers.services_lifecycle
    COSMOSDB_CONTAINER_SERVICES_PUBLICATION = local.cosmos_containers.services_publication

    AZURE_CREDENTIALS_SCOPE_URL           = var.backoffice_app.azure_credentials_scope_url
    AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL = var.backoffice_app.azure_apim_subscriptions_api_base_url

    API_SERVICES_CMS_URL                      = "https://${module.webapp_functions_app.default_hostname}"
    API_SERVICES_CMS_BASE_PATH                = "/api/v1"
    API_SERVICES_CMS_MOCKING                  = true
    API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES = var.backoffice_app.api_services_cms_topics_cache_ttl_minutes

    # Selfcare
    SELFCARE_EXTERNAL_API_BASE_URL = var.backoffice_app.selfcare_external_api_base_url
    SELFCARE_JWKS_PATH             = var.backoffice_app.selfcare_jwks_path
    SELFCARE_API_KEY               = data.azurerm_key_vault_secret.selfcare_api_key.value
    SELFCARE_API_MOCKING           = true

    # Subscriptions Migration
    SUBSCRIPTION_MIGRATION_API_URL     = var.backoffice_app.subscription_migration_api_url
    SUBSCRIPTION_MIGRATION_API_KEY     = data.azurerm_key_vault_secret.subscription_migration_api_key.value
    SUBSCRIPTION_MIGRATION_API_MOCKING = true


    // Fetch keepalive
    FETCH_KEEPALIVE_ENABLED             = "true"
    FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
    FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
    FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
    FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
    FETCH_KEEPALIVE_TIMEOUT             = "60000"

  })
}


module "backoffice_app" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//app_service?ref=v7.45.0"

  name                = format("%s-%s-backoffice-app", local.project, local.application_basename)
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  plan_name = format("%s-%s-backoffice-plan", local.project, local.application_basename)
  sku_name  = var.backoffice_app.sku_name

  node_version = local.backoffice_node_version

  health_check_path = local.backoffice_health_check_path

  app_settings = merge(local.backoffice_app_settings, {
    IS_MSW_ENABLED = false,
    APP_ENV        = "production"
  })

  sticky_settings = [
    "IS_MSW_ENABLED",
    "APP_ENV"
  ]

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    module.backoffice_app_snet.id,
    data.azurerm_subnet.appgateway_snet.id,
  ]

  tags = var.tags
}

module "backoffice_app_staging" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//app_service_slot?ref=v7.45.0"

  name                = "staging"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  app_service_id   = module.backoffice_app.id
  app_service_name = module.backoffice_app.name

  node_version = local.backoffice_node_version

  health_check_path = local.backoffice_health_check_path

  app_settings = merge(local.backoffice_app_settings, {
    IS_MSW_ENABLED = true,
    APP_ENV        = "staging"
  })

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    module.backoffice_app_snet.id,
    local.is_prod ? data.azurerm_subnet.github_runner_subnet[0].id : null
  ]

  tags = var.tags
}
