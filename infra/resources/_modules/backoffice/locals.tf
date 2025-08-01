
locals {
  backoffice = {
    tier = "standard"
    base_app_settings = {
      NODE_ENV                 = "production"
      WEBSITE_RUN_FROM_PACKAGE = "1"
      BACKOFFICE_HOST          = "selfcare.io.pagopa.it"
      IS_MSW_ENABLED           = false

      # Azure
      AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
      AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
      AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id

      # Apim connection
      AZURE_SUBSCRIPTION_ID     = data.azurerm_subscription.current.subscription_id
      AZURE_APIM                = data.azurerm_api_management.apim_itn.name
      AZURE_APIM_RESOURCE_GROUP = data.azurerm_api_management.apim_itn.resource_group_name
      AZURE_APIM_PRODUCT_NAME   = data.azurerm_api_management_product.apim_itn_product_services.product_id
      APIM_USER_GROUPS          = "apimessagewrite,apiinforead,apimessageread,apilimitedprofileread,apiservicewrite"
      API_APIM_MOCKING          = false

      # Logs
      AI_SDK_CONNECTION_STRING = data.azurerm_application_insights.ai_common.connection_string
      # NextAuthJS
      NEXTAUTH_URL    = "https://selfcare.io.pagopa.it/"
      NEXTAUTH_SECRET = var.bo_auth_session_secret

      # Legacy source data
      LEGACY_COSMOSDB_NAME    = "db"
      LEGACY_COSMOSDB_URI     = data.azurerm_cosmosdb_account.cosmos_legacy.endpoint
      LEGACY_COSMOSDB_KEY     = data.azurerm_key_vault_secret.legacy_cosmosdb_key.value
      LEGACY_COSMOSDB_MOCKING = false

      # Services CMS source data
      COSMOSDB_NAME                           = "db-services-cms"
      COSMOSDB_URI                            = data.azurerm_cosmosdb_account.cosmos.endpoint
      COSMOSDB_KEY                            = data.azurerm_cosmosdb_account.cosmos.primary_key
      COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = "services-lifecycle"
      COSMOSDB_CONTAINER_SERVICES_PUBLICATION = "services-publication"

      AZURE_CREDENTIALS_SCOPE_URL           = "https://management.azure.com/.default"
      AZURE_APIM_SUBSCRIPTIONS_API_BASE_URL = "https://management.azure.com/subscriptions/"

      API_SERVICES_CMS_URL                      = "https://${var.cms_fn_default_hostname}"
      API_SERVICES_CMS_BASE_PATH                = "/api/v1"
      API_SERVICES_CMS_MOCKING                  = false
      API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES = "60"

      # Selfcare
      SELFCARE_EXTERNAL_API_BASE_URL = "https://api.selfcare.pagopa.it/external/v2"
      SELFCARE_JWKS_PATH             = "/.well-known/jwks.json"
      SELFCARE_API_KEY               = data.azurerm_key_vault_secret.selfcare_api_key.value
      SELFCARE_API_MOCKING           = false

      # Subscriptions Migration
      SUBSCRIPTION_MIGRATION_API_URL     = "https://io-p-subsmigrations-fn.azurewebsites.net/api/v1"
      SUBSCRIPTION_MIGRATION_API_KEY     = data.azurerm_key_vault_secret.subscription_migration_api_key.value
      SUBSCRIPTION_MIGRATION_API_MOCKING = false


      // Fetch keepalive
      FETCH_KEEPALIVE_ENABLED             = "true"
      FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
      FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
      FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
      FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
      FETCH_KEEPALIVE_TIMEOUT             = "60000"

      // Group ApiKey feature
      GROUP_AUTHZ_ENABLED = true
    }

    prod_app_setting = {
      APP_ENV = "production"
    }

    staging_app_setting = {
      APP_ENV = "staging"
    }

    sticky_settings = [
      "APP_ENV"
    ]

    autoscale_settings = {
      min     = 3
      max     = 30
      default = 3
    }
  }
}
