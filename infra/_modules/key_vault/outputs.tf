output "key_vault_id" {
  value = module.key_vault.id
}

output "secrets_name" {
  value = {
    bo_auth_session_secret                   = local.key_vault.secrets_name.bo_auth_session_secret
    jira_token                               = local.key_vault.secrets_name.jira_token
    azure_client_secret_credential_secret    = local.key_vault.secrets_name.azure_client_secret_credential_secret
    azure_client_secret_credential_client_id = local.key_vault.secrets_name.azure_client_secret_credential_client_id
    serviceid_quality_check_exclusion_list   = local.key_vault.secrets_name.serviceid_quality_check_exclusion_list
    function_apim_key                        = local.key_vault.secrets_name.function_apim_key
    asset_storage_connectionstring_secret    = local.key_vault.secrets_name.asset_storage_connectionstring_secret
    selfcare_api_key                         = local.key_vault.secrets_name.selfcare_api_key
    subscription_migration_api_key           = local.key_vault.secrets_name.subscription_migration_api_key
    legacy_cosmosdb_connectionstring         = local.key_vault.secrets_name.legacy_cosmosdb_connectionstring
    legacy_cosmosdb_key                      = local.key_vault.secrets_name.legacy_cosmosdb_key
    pgres_flex_admin_pwd                     = local.key_vault.secrets_name.pgres_flex_admin_pwd
    pgres_flex_reviewer_usr_pwd              = local.key_vault.secrets_name.pgres_flex_reviewer_usr_pwd
    pgres_flex_readonly_usr_pwd              = local.key_vault.secrets_name.pgres_flex_readonly_usr_pwd
  }
}