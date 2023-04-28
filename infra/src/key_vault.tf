module "key_vault_domain" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//key_vault?ref=v6.3.0"

  name                       = "${local.project}-${local.application_basename}-kv"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 90
  sku_name                   = "premium"

  lock_enable = true

  tags = var.tags
}
