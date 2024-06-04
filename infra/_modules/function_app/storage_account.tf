
resource "azurerm_storage_container" "static_content" {
  name                  = "static-content"
  storage_account_name  = module.app_be_fn.storage_account.name
  container_access_type = "private"
}

resource "azurerm_storage_blob" "featured_services" {
  name                   = "featured-services.json"
  storage_account_name   = azurerm_storage_container.static_content.storage_account_name
  storage_container_name = azurerm_storage_container.static_content.name
  type                   = "Block"
  source                 = "${path.module}/featured-services.json"
}

resource "azurerm_storage_blob" "featured_institutions" {
  name                   = "featured-institutions.json"
  storage_account_name   = azurerm_storage_container.static_content.storage_account_name
  storage_container_name = azurerm_storage_container.static_content.name
  type                   = "Block"
  source                 = "${path.module}/featured-institutions.json"
}

resource "azurerm_storage_account" "static_content" {
  name                     = replace("${local.project}-${var.domain}-${local.app_name}-st01", "-", "")
  location                 = var.location
  resource_group_name      = var.resource_group_name
  account_tier             = "Standard"
  account_kind             = "StorageV2"
  account_replication_type = "ZRS"

  public_network_access_enabled   = false
  shared_access_key_enabled       = true
  default_to_oauth_authentication = false
  allow_nested_items_to_be_public = false

  tags = var.tags
}

resource "azurerm_storage_account_network_rules" "st_network_rules" {
  storage_account_id = azurerm_storage_account.static_content.id
  default_action     = "Deny"
  bypass             = ["Metrics", "Logging", "AzureServices"]

  depends_on = [
    module.app_be_fn
  ]
}

resource "azurerm_private_endpoint" "st_blob" {
  name                = "${local.project}-${var.domain}-${local.app_name}-static-content-blob-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.peps_snet_id

  private_service_connection {
    name                           = "${local.project}-${var.domain}-${local.app_name}-static-content-blob-pep-01"
    private_connection_resource_id = azurerm_storage_account.static_content.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_account_blob.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "st_file" {
  name                = "${local.project}-${var.domain}-${local.app_name}-static-content-file-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.peps_snet_id

  private_service_connection {
    name                           = "${local.project}-${var.domain}-${local.app_name}-static-content-file-pep-01"
    private_connection_resource_id = azurerm_storage_account.static_content.id
    is_manual_connection           = false
    subresource_names              = ["file"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_account_file.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "st_queue" {
  name                = "${local.project}-${var.domain}-${local.app_name}-static-content-queue-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.peps_snet_id

  private_service_connection {
    name                           = "${local.project}-${var.domain}-${local.app_name}-static-content-queue-pep-01"
    private_connection_resource_id = azurerm_storage_account.static_content.id
    is_manual_connection           = false
    subresource_names              = ["queue"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_account_queue.id]
  }

  tags = var.tags
}