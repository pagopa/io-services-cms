output "secrets" {
  value = {
    bo_auth_session_secret                   = azurerm_key_vault_secret.bo_auth_session_secret.value
    jira_token                               = data.azurerm_key_vault_secret.jira_token.value
    azure_client_secret_credential_secret    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
    azure_client_secret_credential_client_id = data.azurerm_key_vault_secret.azure_client_secret_credential_client_id.value
    serviceid_quality_check_exclusion_list   = data.azurerm_key_vault_secret.serviceid_quality_check_exclusion_list.value
    function_apim_key                        = data.azurerm_key_vault_secret.function_apim_key.value
    asset_storage_connectionstring_secret    = data.azurerm_key_vault_secret.asset_storage_connectionstring_secret.value
    selfcare_api_key                         = data.azurerm_key_vault_secret.selfcare_api_key.value
    subscription_migration_api_key           = data.azurerm_key_vault_secret.subscription_migration_api_key.value
    legacy_cosmosdb_connectionstring         = data.azurerm_key_vault_secret.legacy_cosmosdb_connectionstring.value
    legacy_cosmosdb_key                      = data.azurerm_key_vault_secret.legacy_cosmosdb_key.value
    pgres_flex_admin_pwd                     = azurerm_key_vault_secret.pgres_flex_admin_pwd.value
    pgres_flex_reviewer_usr_pwd              = azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd.value
    pgres_flex_readonly_usr_pwd              = azurerm_key_vault_secret.pgres_flex_readonly_usr_pwd.value
  }
}