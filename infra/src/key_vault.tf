module "key_vault_domain" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//key_vault?ref=v8.44.2"

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

resource "azurerm_key_vault_access_policy" "adgroup_svc_admins" {
  key_vault_id = module.key_vault_domain.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_svc_admins.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "adgroup_svc_developers" {
  key_vault_id = module.key_vault_domain.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_svc_developers.object_id

  key_permissions         = []
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = []
}

resource "azurerm_key_vault_access_policy" "github_infra_ci" {
  key_vault_id = module.key_vault_domain.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_user_assigned_identity.infra_ci.principal_id

  key_permissions         = ["Get", "List", ]
  secret_permissions      = ["Get", "List", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", ]
}

resource "azurerm_key_vault_access_policy" "github_infra_cd" {
  key_vault_id = module.key_vault_domain.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_user_assigned_identity.infra_cd.principal_id

  key_permissions         = ["Get", "List", ]
  secret_permissions      = ["Get", "List", "Set"]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", ]
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
  name            = "bo-auth-session-secret"
  key_vault_id    = module.key_vault_domain.id
  value           = random_password.bo_auth_session_secret[var.bo_auth_session_secret_rotation_id].result
  content_type    = "string"
  expiration_date = "2028-09-27T07:41:36Z"
}

data "azurerm_key_vault_secret" "asset_storage_connectionstring_secret" {
  name         = "ASSET-STORAGE-CONNECTIONSTRING-SECRET"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "selfcare_api_key" {
  name         = "SELFCARE-API-KEY"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "subscription_migration_api_key" {
  name         = "SUBSCRIPTION-MIGRATION-API-KEY"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault" "key_vault_common" {
  name                = var.key_vault_common.name
  resource_group_name = var.key_vault_common.resource_group_name
}
data "azurerm_key_vault_secret" "subscriptionmigrations_db_server_adm_username" {
  name         = "selfcare-subsmigrations-DB-ADM-USERNAME"
  key_vault_id = data.azurerm_key_vault.key_vault_common.id
}

data "azurerm_key_vault_secret" "subscriptionmigrations_db_server_adm_password" {
  name         = "selfcare-subsmigrations-DB-ADM-PASSWORD"
  key_vault_id = data.azurerm_key_vault.key_vault_common.id
}
