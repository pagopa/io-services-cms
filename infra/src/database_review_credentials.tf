# Credentials are generated randomly and stored in the keyvault (for future reading access)
# To renew credentials, edit the rotation id variable

#########
# ADMIN #
#########

locals {
  postgres_admin_username = "pgadminusr"
}

resource "random_password" "postgres_admin_password" {
  for_each    = toset([var.postgres_admin_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "azurerm_key_vault_secret" "pgres_flex_admin_pwd" {
  name            = "pgres-flex-admin-pwd"
  key_vault_id    = module.key_vault_domain.id
  value           = random_password.postgres_admin_password[var.postgres_admin_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2025-04-28T23:59:59Z"
}


############
# REVIEWER #
############

resource "random_password" "postgres_reviewer_usr_password" {
  for_each    = toset([var.postgres_reviewer_usr_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "azurerm_key_vault_secret" "pgres_flex_reviewer_usr_pwd" {
  name            = "pgres-flex-reviewer-usr-pwd"
  key_vault_id    = module.key_vault_domain.id
  value           = random_password.postgres_reviewer_usr_password[var.postgres_reviewer_usr_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2025-04-28T23:59:59Z"
}

resource "random_password" "postgres_readonly_usr_password" {
  for_each    = toset([var.postgres_readonly_usr_credentials_rotation_id])
  length      = 32
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "azurerm_key_vault_secret" "pgres_flex_readonly_usr_pwd" {
  name            = "pgres-flex-readonly-usr-pwd"
  key_vault_id    = module.key_vault_domain.id
  value           = random_password.postgres_readonly_usr_password[var.postgres_readonly_usr_credentials_rotation_id].result
  content_type    = "string"
  expiration_date = "2026-02-19T23:59:59Z"
}
