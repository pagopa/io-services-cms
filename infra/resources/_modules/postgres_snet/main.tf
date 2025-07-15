resource "available_subnet_cidr" "next_cidr" {
  virtual_network_id = module.postgres_flexible_itn_snet.id
  prefix_length      = 24 # For a /24 subnet
}

module "pgres_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v4//subnet?ref=v7.20.0"
  name                 = "${var.project}-${var.application_basename}-pgres-snet-01"
  resource_group_name  = var.virtual_network.resource_group_name
  virtual_network_name = var.virtual_network.name
  address_prefixes     = [available_subnet_cidr.next_cidr.cidr_block]
}
