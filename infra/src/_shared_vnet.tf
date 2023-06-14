variable "vnet_common_rg" {
  type        = string
  description = "Common Virtual network resource group name."
  default     = ""
}

variable "vnet_name" {
  type        = string
  description = "Common Virtual network resource name."
  default     = ""
}

data "azurerm_resource_group" "vnet_common_rg" {
  name = var.vnet_common_rg
}

data "azurerm_virtual_network" "vnet_common" {
  name                = var.vnet_name
  resource_group_name = data.azurerm_resource_group.vnet_common_rg.name
}

data "azurerm_subnet" "private_endpoints_subnet" {
  count = local.is_prod ? 1 : 0

  name                 = "pendpoints"
  virtual_network_name = var.vnet_name
  resource_group_name  = var.vnet_common_rg
}

data "azurerm_subnet" "github_runner_subnet" {
  count = local.is_prod ? 1 : 0

  name                 = "io-p-github-runner-snet"
  virtual_network_name = var.vnet_name
  resource_group_name  = var.vnet_common_rg
}

data "azurerm_private_dns_zone" "privatelink_documents_azure_com" {
  count = local.is_prod ? 1 : 0

  name                = "privatelink.documents.azure.com"
  resource_group_name = var.vnet_common_rg
}
