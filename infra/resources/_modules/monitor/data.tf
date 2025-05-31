####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "slack_svc_monitor_webhook_url" {
  name         = var.key_vault.secrets_name.slack_svc_monitor_webhook_url
  key_vault_id = var.key_vault.id
}

data "azurerm_key_vault" "kv" {
  name                = "io-p-kv"
  resource_group_name = "io-p-sec-rg"
}

data "azurerm_key_vault_secret" "alert_error_notification_opsgenie" {
  name         = "alert-error-notification-opsgenie"
  key_vault_id = data.azurerm_key_vault.kv.id
}
