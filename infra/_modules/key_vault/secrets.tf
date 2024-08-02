resource "random_password" "bo_auth_session_secret" {
  for_each    = toset([var.bo_auth_session_secret_rotation_id])
  length      = 16
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "azurerm_key_vault_secret" "bo_auth_session_secret" {
  name            = "bo-auth-session-secret"
  key_vault_id    = module.key_vault.id
  value           = random_password.bo_auth_session_secret[var.bo_auth_session_secret_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-09-27T07:41:36Z"
}


# !!! TODO: enable in another PR when all those secrets are inserted on the new kv !!!
#
#data "azurerm_key_vault_secret" "jira_token" {
#  name         = "JIRA-TOKEN"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "azure_client_secret_credential_secret" {
#  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "azure_client_secret_credential_client_id" {
#  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-CLIENT-ID"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "serviceid_quality_check_exclusion_list" {
#  name         = "SERVICEID-QUALITY-CHECK-EXCLUSION-LIST"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "function_apim_key" {
#  name         = "${local.project}-services-cms-webapp-fn-apim-key"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "asset_storage_connectionstring_secret" {
#  name         = "ASSET-STORAGE-CONNECTIONSTRING-SECRET"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "selfcare_api_key" {
#  name         = "SELFCARE-API-KEY"
#  key_vault_id = module.key_vault.id
#}
#
#data "azurerm_key_vault_secret" "subscription_migration_api_key" {
#  name         = "SUBSCRIPTION-MIGRATION-API-KEY"
#  key_vault_id = module.key_vault.id
#}