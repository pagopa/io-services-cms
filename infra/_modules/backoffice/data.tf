data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_application_insights" "ai_common" {
  name                = "${var.prefix}-${var.env_short}-ai-common"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_cosmosdb_account" "cosmos_legacy" {
  name                = "${var.prefix}-${var.env_short}-cosmos-api"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-internal"
}

data "azurerm_monitor_action_group" "error_action_group" {
  name                = "${var.prefix}${var.env_short}error"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_api_management" "apim_v2" {
  name                = "${var.prefix}-${var.env_short}-apim-v2-api"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-internal"
}

data "azurerm_api_management_product" "apim_v2_product_services" {
  product_id          = "${var.prefix}-services-api"
  api_management_name = "${var.prefix}-${var.env_short}-apim-v2-api"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-internal"
}

####################
# KeyVault Secrets #
####################

data "azurerm_key_vault" "backoffice_key_vault" {
  name                = "${var.prefix}-${var.env_short}-services-cms-kv"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_client_id" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-CLIENT-ID"
  key_vault_id = data.azurerm_key_vault.backoffice_key_vault.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_secret" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
  key_vault_id = data.azurerm_key_vault.backoffice_key_vault.id
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_key" {
  name         = "legacy-cosmosdb-key"
  key_vault_id = data.azurerm_key_vault.backoffice_key_vault.id
}

data "azurerm_key_vault_secret" "selfcare_api_key" {
  name         = "SELFCARE-API-KEY"
  key_vault_id = data.azurerm_key_vault.backoffice_key_vault.id
}

data "azurerm_key_vault_secret" "subscription_migration_api_key" {
  name         = "SUBSCRIPTION-MIGRATION-API-KEY"
  key_vault_id = data.azurerm_key_vault.backoffice_key_vault.id
}