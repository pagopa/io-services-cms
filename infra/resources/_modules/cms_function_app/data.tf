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

data "azurerm_data_factory" "adf" {
  name                = "io-p-data-factory"
  resource_group_name = "io-p-rg-operations"
}

####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "jira_token" {
  name         = var.jira_token_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "serviceid_quality_check_exclusion_list" {
  name         = var.serviceid_quality_check_exclusion_list_name
  key_vault_id = var.key_vault_id
}


data "azurerm_key_vault_secret" "legacy_cosmosdb_connectionstring" {
  name         = var.legacy_cosmosdb_connectionstring_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_key" {
  name         = var.legacy_cosmosdb_key_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "asset_storage_connectionstring_secret" {
  name         = var.asset_storage_connectionstring_secret_name
  key_vault_id = var.key_vault_id
}


data "azurerm_key_vault_secret" "services_publication_event_hub_connection_string" {
  name         = var.services_publication_event_hub_connection_string_name
  key_vault_id = var.key_vault_id
}


data "azurerm_key_vault_secret" "services_topics_event_hub_connection_string" {
  name         = var.services_topics_event_hub_connection_string_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "services_lifecycle_event_hub_connection_string" {
  name         = var.services_lifecycle_event_hub_connection_string_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "services_history_event_hub_connection_string" {
  name         = var.services_history_event_hub_connection_string_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "activations_event_hub_connection_string" {
  name         = var.activations_event_hub_connection_string_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "eh_sc_connectionstring" {
  name         = var.eh_sc_connectionstring_name
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "pdv_tokenizer_api_key" {
  name         = var.pdv_tokenizer_api_key_name
  key_vault_id = var.key_vault_id
}
