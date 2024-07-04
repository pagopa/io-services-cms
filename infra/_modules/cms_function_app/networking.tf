resource "azurerm_private_endpoint" "st_queuest_queue" {
  name                = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-cms-st-queue-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.peps_snet_id

  private_service_connection {
    name                           = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-queuest-queue-pep-01"
    private_connection_resource_id = module.cms_storage_account.id
    is_manual_connection           = false
    subresource_names              = ["queue"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_account_queue.id]
  }

  tags = var.tags
}
