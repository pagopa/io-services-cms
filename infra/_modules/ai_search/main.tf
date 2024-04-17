#####################
#  Azure AI Search  #
#####################

resource "azurerm_search_service" "srch" {
  name                          = "${var.project}-${var.application_basename}-srch-001"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  public_network_access_enabled = var.public_network_access_enabled
  local_authentication_enabled  = false

  sku             = var.sku
  replica_count   = var.replica_count
  partition_count = var.partition_count

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "srch" {
  depends_on          = [azurerm_search_service.srch]
  name                = "${var.project}-${var.application_basename}-pep-001"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.snet_id

  private_service_connection {
    name                           = "${var.project}-${var.application_basename}-srch-001"
    private_connection_resource_id = azurerm_search_service.srch.id
    is_manual_connection           = false
    subresource_names              = ["link"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_srch.id]
  }

  tags = var.tags
}