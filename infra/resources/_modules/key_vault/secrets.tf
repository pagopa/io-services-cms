/*****************************************
 * random password resources for secrets *
 *****************************************/

resource "random_password" "bo_auth_session_secret" {
  for_each    = toset([var.bo_auth_session_secret_rotation_id])
  length      = 16
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "random_password" "postgres_admin_password" {
  for_each    = toset([var.postgres_admin_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "random_password" "postgres_reviewer_usr_password" {
  for_each    = toset([var.postgres_reviewer_usr_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "random_password" "postgres_readonly_usr_password" {
  for_each    = toset([var.postgres_readonly_usr_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "random_password" "appbe_host_key_for_app_backend" {
  for_each = toset([var.appbe_host_key_for_app_backend_rotation_id])
  length   = 64
  special  = true
  # Only allow these specific safe symbols
  override_special = "_-."
  min_upper        = 2
  min_lower        = 2
  min_numeric      = 2
  min_special      = 2
}

resource "random_password" "appbe_host_key_for_apim_platform" {
  for_each = toset([var.appbe_host_key_for_apim_platform_rotation_id])
  length   = 64
  special  = true
  # Only allow these specific safe symbols
  override_special = "_-."
  min_upper        = 2
  min_lower        = 2
  min_numeric      = 2
  min_special      = 2
}


/*************************************
 * key vault secrets for credentials *
 *************************************/

resource "azurerm_key_vault_secret" "bo_auth_session_secret" {
  name            = "bo-auth-session-secret"
  key_vault_id    = module.key_vault.id
  value           = random_password.bo_auth_session_secret[var.bo_auth_session_secret_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-09-27T07:41:36Z"
}

resource "azurerm_key_vault_secret" "pgres_flex_admin_pwd" {
  name            = local.key_vault.secrets_name.cms_pgres_admin_pwd
  key_vault_id    = module.key_vault.id
  value           = random_password.postgres_admin_password[var.postgres_admin_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2025-04-28T23:59:59Z"
}

resource "azurerm_key_vault_secret" "pgres_flex_reviewer_usr_pwd" {
  name            = local.key_vault.secrets_name.cms_pgres_reviewer_usr_pwd
  key_vault_id    = module.key_vault.id
  value           = random_password.postgres_reviewer_usr_password[var.postgres_reviewer_usr_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2025-04-28T23:59:59Z"
}

resource "azurerm_key_vault_secret" "pgres_flex_readonly_usr_pwd" {
  name            = "pgres-flex-readonly-usr-pwd"
  key_vault_id    = module.key_vault.id
  value           = random_password.postgres_readonly_usr_password[var.postgres_readonly_usr_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2026-02-19T23:59:59Z"
}

resource "azurerm_key_vault_secret" "appbe_host_key_for_app_backend" {
  name            = local.key_vault.secrets_name.appbe_host_key_for_app_backend
  key_vault_id    = module.key_vault.id
  value           = random_password.appbe_host_key_for_app_backend[var.appbe_host_key_for_app_backend_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-01-28T16:00:06Z"
}

resource "azurerm_key_vault_secret" "appbe_host_key_for_apim_platform" {
  name            = local.key_vault.secrets_name.appbe_host_key_for_apim_platform
  key_vault_id    = module.key_vault.id
  value           = random_password.appbe_host_key_for_apim_platform[var.appbe_host_key_for_apim_platform_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-01-28T16:00:06Z"
}
