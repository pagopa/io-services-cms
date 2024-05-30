data "azurerm_subscription" "current" {}

data "azurerm_private_dns_zone" "privatelink_srch" {
  name                = "privatelink.search.windows.net"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azuread_group" "adgroup_services_cms" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-services-cms"
}