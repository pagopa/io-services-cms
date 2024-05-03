################
#  Networking  #
################

module "srch_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.3.0"
  name                 = "${var.project}-${var.application_basename}-srch-snet-01"
  resource_group_name  = "${var.project}-common-rg-01"
  virtual_network_name = var.vnet_name
  address_prefixes     = var.srch_snet_cidrs

  private_endpoint_network_policies_enabled = false
}

module "app_be_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.3.0"
  name                 = "${var.project}-${var.application_basename}-app-be-snet-01"
  resource_group_name  = "${var.project}-common-rg-01"
  virtual_network_name = var.vnet_name
  address_prefixes     = var.app_be_snet_cidrs

  private_endpoint_network_policies_enabled = false

  service_endpoints = [
    "Microsoft.Web",
  ]

  delegation = {
    name = "default"
    service_delegation = {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }

}
