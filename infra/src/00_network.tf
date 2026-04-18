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

