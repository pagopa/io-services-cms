data "azurerm_key_vault" "svc_kv" {
  name                = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv"
  resource_group_name = "${local.project}-svc-rg-01"
}

data "azurerm_key_vault_secret" "slack_webhook_url" {
  key_vault_id = data.azurerm_key_vault.svc_kv.id
  name         = "slack-webhook-url-terraform-drift"
}
