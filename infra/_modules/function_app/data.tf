data "azurerm_application_insights" "ai_common" {
  name                = "${var.prefix}-${var.env_short}-ai-common"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azurerm_private_dns_zone" "storage_account_blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = var.private_dns_zone_resource_group_name
}

data "azurerm_private_dns_zone" "storage_account_file" {
  name                = "privatelink.file.core.windows.net"
  resource_group_name = var.private_dns_zone_resource_group_name
}

data "azurerm_private_dns_zone" "storage_account_table" {
  name                = "privatelink.table.core.windows.net"
  resource_group_name = var.private_dns_zone_resource_group_name
}

data "azurerm_private_dns_zone" "storage_account_queue" {
  name                = "privatelink.queue.core.windows.net"
  resource_group_name = var.private_dns_zone_resource_group_name
}