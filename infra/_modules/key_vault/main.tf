module "key_vault" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//key_vault?ref=v7.45.0"

  name                       = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-kv"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 90
  sku_name                   = "premium"

  lock_enable = true

  tags = var.tags
}