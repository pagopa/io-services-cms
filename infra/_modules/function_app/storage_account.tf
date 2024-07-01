
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