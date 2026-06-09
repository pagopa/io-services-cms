####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "slack_svc_monitor_email" {
  name         = local.key_vault.secrets_name.slack_svc_monitor_email
  key_vault_id = var.key_vault_id
}

data "azurerm_key_vault_secret" "incident_mgmt_api_key" {
  name         = local.key_vault.secrets_name.incident_mgmt_api_key
  key_vault_id = var.key_vault_id
}
