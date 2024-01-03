data "azurerm_subnet" "github_runner_subnet" {
  count = local.is_prod ? 1 : 0

  name                 = "io-p-github-runner-snet"
  virtual_network_name = var.io_common.vnet_name
  resource_group_name  = var.io_common.resource_group_name
}

data "azurerm_private_dns_zone" "privatelink_documents_azure_com" {
  count = local.is_prod ? 1 : 0

  name                = "privatelink.documents.azure.com"
  resource_group_name = var.io_common.resource_group_name
}


data "azurerm_subnet" "private_endpoints_subnet" {
  count = local.is_prod ? 1 : 0

  name                 = "pendpoints"
  virtual_network_name = var.io_common.vnet_name
  resource_group_name  = var.io_common.resource_group_name
}

data "azurerm_private_dns_zone" "privatelink_postgres_database_azure_com" {
  count = local.is_prod ? 1 : 0

  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.io_common.resource_group_name
}


data "azurerm_subnet" "apim_v2_snet" {
  count = local.is_prod ? 1 : 0

  name                 = "apimv2api"
  virtual_network_name = var.io_common.vnet_name
  resource_group_name  = var.io_common.resource_group_name
}

data "azurerm_subnet" "appgateway_snet" {
  name                 = var.io_common.appgateway_snet_name
  virtual_network_name = var.io_common.vnet_name
  resource_group_name  = var.io_common.resource_group_name
}

data "azurerm_subnet" "devportal_snet" {
  name                 = "${var.prefix}-p-selfcare-be-common-snet"
  virtual_network_name = var.io_common.vnet_name
  resource_group_name  = var.io_common.resource_group_name
}
