####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "slack_svc_monitor_email" {
  name         = var.key_vault.secrets_name.slack_svc_monitor_email
  key_vault_id = var.key_vault.id
}

data "azurerm_key_vault_secret" "opsgenie_svc_api_key" {
  name         = var.key_vault.secrets_name.opsgenie_svc_api_key
  key_vault_id = var.key_vault.id
}
