output "secrets" {
  value = {
    bo_auth_session_secret = azurerm_key_vault_secret.bo_auth_session_secret.value
  }
}