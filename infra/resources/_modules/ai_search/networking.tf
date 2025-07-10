module "srch_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.19.0"
  name                 = "${var.project}-${var.application_basename}-srch-snet-01"
  resource_group_name  = var.virtual_network.resource_group_name
  virtual_network_name = var.virtual_network.name
  address_prefixes     = local.snet_cidrs

  private_endpoint_network_policies_enabled = false
}

resource "azurerm_private_endpoint" "srch" {
  depends_on          = [azurerm_search_service.srch]
  name                = "${var.project}-${var.application_basename}-srch-pep-01"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.peps_snet_id

  private_service_connection {
    name                           = azurerm_search_service.srch.name
    private_connection_resource_id = azurerm_search_service.srch.id
    is_manual_connection           = false
    subresource_names              = ["searchService"]
  }

  private_dns_zone_group {
    name                 = "${var.project}-${var.application_basename}-dns-zone-group-01"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_srch.id]
  }

  tags = var.tags
}

# Must be approved manually in cosmosdb networking page
resource "azurerm_search_shared_private_link_service" "srch_to_cosmos" {
  name               = "${var.project}-${var.application_basename}-spl-01"
  search_service_id  = azurerm_search_service.srch.id
  subresource_name   = "Sql"
  target_resource_id = data.azurerm_cosmosdb_account.cosmos.id
  request_message    = "Enable access from AI Search to CMS services CosmosDB"
}