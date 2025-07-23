output "key_vault_id" {
  value = module.key_vault.id
}

output "secrets_name" {
  value = local.key_vault.secrets_name
}

output "secrets_value" {
  value = {
    bo_auth_session_secret     = azurerm_key_vault_secret.bo_auth_session_secret.value
    cms_pgres_admin_pwd        = azurerm_key_vault_secret.pgres_flex_admin_pwd.value
    cms_pgres_reviewer_usr_pwd = azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd.value
  }
  sensitive = true
}
