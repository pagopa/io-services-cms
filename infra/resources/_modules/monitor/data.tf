####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "slack_svc_monitor_webhook_url" {
  name         = var.key_vault.secrets_name.slack_svc_monitor_webhook_url
  key_vault_id = var.key_vault.id
}

data "azurerm_key_vault_secret" "opsgenie_svc_api_key" {
  name         = var.key_vault.secrets_name.opsgenie_svc_api_key
  key_vault_id = var.key_vault.id
}
