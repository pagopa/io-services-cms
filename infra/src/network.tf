#
# Variables
#

variable "cidr_subnet" {
  type        = string
  description = "Subnet address space."
}


#
# SNET definition
#

module "app_snet" {
  source               = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v6.3.0"
  name                 = "${local.project}-${var.application_basename}-snet"
  address_prefixes     = [var.cidr_subnet]
  resource_group_name  = data.azurerm_resource_group.vnet_common_rg.name
  virtual_network_name = data.azurerm_virtual_network.vnet_common.name

  private_endpoint_network_policies_enabled     = true
  private_link_service_network_policies_enabled = true

  service_endpoints = [
    "Microsoft.Web",
    "Microsoft.AzureCosmosDB",
    "Microsoft.Storage",
  ]

  delegation = {
    name = "default"
    service_delegation = {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}
