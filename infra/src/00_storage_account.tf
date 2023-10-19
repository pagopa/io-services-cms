data "azurerm_storage_account" "cdn_assets_storage_account" {
  name                = "iopstcdnassets"
  resource_group_name = var.io_common.resource_group_name
}