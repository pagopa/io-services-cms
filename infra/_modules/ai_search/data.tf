data "azurerm_subscription" "current" {}

data "azurerm_private_dns_zone" "privatelink_srch" {
  name                = "privatelink.search.windows.net"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_subnet" "pep_snet" {
  name                 = "${var.project}-pep-snet-001"
  virtual_network_name = "${var.project}-common-vnet-001"
  resource_group_name  = "${var.project}-common-rg-001"
}