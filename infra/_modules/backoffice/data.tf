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