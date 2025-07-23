####################
# KeyVault Secrets #
####################

data "azurerm_key_vault_secret" "cms_pgres_admin_pwd" {
  name         = var.key_vault.secrets_name.cms_pgres_admin_pwd
  key_vault_id = var.key_vault.id
}
