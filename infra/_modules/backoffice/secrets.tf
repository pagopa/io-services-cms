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
  key_vault_id    = data.azurerm_key_vault.backoffice_key_vault.id
  value           = random_password.bo_auth_session_secret[var.bo_auth_session_secret_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-09-27T07:41:36Z"
}