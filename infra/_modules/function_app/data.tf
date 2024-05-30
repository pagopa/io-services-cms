data "azurerm_application_insights" "ai_common" {
  name                = "${var.prefix}-${var.env_short}-ai-common"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_subnet" "appbackendl1_snet" {
  name                 = "appbackendl1"
  virtual_network_name = "${var.prefix}-${var.env_short}-vnet-common"
  resource_group_name  = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_subnet" "appbackendl2_snet" {
  name                 = "appbackendl2"
  virtual_network_name = "${var.prefix}-${var.env_short}-vnet-common"
  resource_group_name  = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_subnet" "appbackendli_snet" {
  name                 = "appbackendli"
  virtual_network_name = "${var.prefix}-${var.env_short}-vnet-common"
  resource_group_name  = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_subnet" "github_runner_subnet" {
  name                 = "${var.prefix}-${var.env_short}-github-runner-snet"
  virtual_network_name = "${var.prefix}-${var.env_short}-vnet-common"
  resource_group_name  = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_private_dns_zone" "privatelink_websites" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}
