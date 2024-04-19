################
#  Networking  #
################

module "snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.3.0"
  name                 = "${var.project}-${var.application_basename}-srch-snet-001"
  resource_group_name  = var.resource_group_name
  virtual_network_name = var.vnet_name
  address_prefixes     = var.snet_cidrs

  private_endpoint_network_policies_enabled = false
}
