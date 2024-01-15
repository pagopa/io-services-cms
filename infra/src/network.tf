#
# SNET definition
#

module "app_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v7.45.0"
  name                 = "${local.project}-${local.application_basename}-snet"
  address_prefixes     = var.subnets_cidrs.api
  resource_group_name  = var.io_common.resource_group_name
  virtual_network_name = var.io_common.vnet_name

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

#
# Postgres Flexible Server subnet
#
module "postgres_flexible_snet" {
  source                                    = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v7.45.0"
  name                                      = "${local.project}-${local.application_basename}-pgres-flexible-snet"
  address_prefixes                          = var.subnets_cidrs.postgres
  resource_group_name                       = var.io_common.resource_group_name
  virtual_network_name                      = var.io_common.vnet_name
  service_endpoints                         = ["Microsoft.Storage"]
  private_endpoint_network_policies_enabled = true

  delegation = {
    name = "delegation"
    service_delegation = {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}


#
# SNET definition
#

module "backoffice_app_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v7.45.0"
  name                 = format("%s-%s-backoffice-snet", local.project, local.application_basename)
  resource_group_name  = var.io_common.resource_group_name
  virtual_network_name = var.io_common.vnet_name
  address_prefixes     = var.subnets_cidrs.backoffice

  private_endpoint_network_policies_enabled = false # FIXME: is it correct?

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
