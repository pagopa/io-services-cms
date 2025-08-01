#
# SNET definition
#

module "app_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v4.git//subnet?ref=v7.18.1"
  name                 = "${local.project}-${local.application_basename}-snet"
  address_prefixes     = var.subnets_cidrs.api
  resource_group_name  = var.io_common.resource_group_name
  virtual_network_name = var.io_common.vnet_name

  private_endpoint_network_policies             = "Enabled"
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
# Cosmos Private Endpoint
#

data "azurerm_subnet" "private_endpoints_subnet_itn" {
  name                 = "io-p-itn-pep-snet-01"
  virtual_network_name = local.vnet_common_name_itn
  resource_group_name  = local.vnet_common_resource_group_name_itn
}

resource "azurerm_private_endpoint" "cosmos_db" {
  name                = "${local.project_itn}-svc-cosno-pep-01"
  location            = "italynorth"
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet_itn.id

  private_service_connection {
    name                           = "${local.project_itn}-svc-cosno-pep-01"
    private_connection_resource_id = module.cosmosdb_account.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name = "private-dns-zone-group"
    private_dns_zone_ids = [
      data.azurerm_private_dns_zone.privatelink_documents_azure_com[0].id
    ]
  }
}
