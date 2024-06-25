data "azurerm_subscription" "current" {}

data "azurerm_application_insights" "ai_common" {
  name                = "${var.prefix}-${var.env_short}-ai-common"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_cosmosdb_account" "cosmos_legacy" {
  name                = var.legacy_cosmosdb_resource_name
  resource_group_name = var.legacy_cosmosdb_resource_group
}

data "azurerm_monitor_action_group" "error_action_group" {
  name                = "${var.prefix}${var.env_short}error"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

// TODO: To be replaced with the internal one after first apply
data "azurerm_storage_account" "cms_storage_account" {
  name                = "${var.prefix}${var.env_short}servicescmsst"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_postgresql_flexible_server" "cms_private_pgflex" {
  name                = "${var.prefix}-${var.env_short}-services-cms-private-pgflex"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_subnet" "backoffice_app_snet" {
  name                 = "${var.prefix}-${var.env_short}-backoffice-snet"
  virtual_network_name = "${var.prefix}-${var.env_short}-vnet-common"
  resource_group_name  = "${var.prefix}-${var.env_short}-rg-common"
}

####################
# KeyVault Secrets #
####################

data "azure_key_vault" "cms_key_vault" {
  name                = "${var.prefix}-${var.env_short}-services-cms-kv"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_key_vault_secret" "pgres_flex_reviewer_usr_pwd" {
  name         = "pgres-flex-reviewer-usr-pwd"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}

data "azurerm_key_vault_secret" "jira_token" {
  name         = "JIRA-TOKEN"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_secret" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_client_id" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-CLIENT-ID"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}

data "azurerm_key_vault_secret" "serviceid_quality_check_exclusion_list" {
  name         = "SERVICEID-QUALITY-CHECK-EXCLUSION-LIST"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}

data "azurerm_key_vault_secret" "function_apim_key" {
  name         = "${local.project}-services-cms-webapp-fn-apim-key"
  key_vault_id = data.azurerm_key_vault.cms_key_vault.id
}