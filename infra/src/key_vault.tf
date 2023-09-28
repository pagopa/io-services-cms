module "key_vault_domain" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//key_vault?ref=v6.19.1"

  name                       = "${local.project}-${local.application_basename}-kv"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 90
  sku_name                   = "premium"

  lock_enable = true

  tags = var.tags
}

data "azurerm_key_vault_secret" "jira_token" {
  name         = "JIRA-TOKEN"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_secret" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_client_id" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-CLIENT-ID"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "serviceid_quality_check_exclusion_list" {
  name         = "SERVICEID-QUALITY-CHECK-EXCLUSION-LIST"
  key_vault_id = module.key_vault_domain.id
}

resource "azurerm_key_vault_access_policy" "adgroup_admin" {
  key_vault_id = module.key_vault_domain.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_admin.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "adgroup_services_cms" {
  key_vault_id = module.key_vault_domain.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_services_cms.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "github_action_ci" {
  key_vault_id = module.key_vault_domain.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azuread_service_principal.github_action_iac_ci.object_id

  secret_permissions      = ["Get", "List", ]
  storage_permissions     = []
  certificate_permissions = []
  key_permissions         = []
}

resource "azurerm_key_vault_access_policy" "github_action_cd" {
  key_vault_id = module.key_vault_domain.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azuread_service_principal.github_action_iac_cd.object_id

  secret_permissions      = ["Get", "List", "Set", ]
  storage_permissions     = []
  certificate_permissions = []
  key_permissions         = []
}

resource "azurerm_key_vault_secret" "webapp_fn_app_key" { # FIXME: remove
  name            = "webapp-fn-app-key"
  key_vault_id    = module.key_vault_domain.id
  value           = module.webapp_functions_app.primary_key
  content_type    = "string"
  expiration_date = "2025-06-26T23:59:59Z"
}

resource "random_password" "bo_auth_session_secret" {
  for_each    = toset([var.bo_auth_session_secret_rotation_id])
  length      = 16
  min_lower   = 3
  min_numeric = 3
  min_special = 3
  min_upper   = 3
}

resource "azurerm_key_vault_secret" "bo_auth_session_secret" {
  name            = "pgres-flex-admin-pwd"
  key_vault_id    = module.key_vault_domain.id
  value           = random_password.bo_auth_session_secret[var.bo_auth_session_secret_rotation_id].result
  content_type    = "string"
  expiration_date = timeadd(formatdate("YYYY-MM-DD'T'HH:mm:ssZ", timestamp()), "43800h") # expires 5 yers after creation
}
