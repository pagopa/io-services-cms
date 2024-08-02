resource "azurerm_key_vault_access_policy" "adgroup_admin" {
  key_vault_id = module.key_vault.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_admin.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "adgroup_services_cms" {
  key_vault_id = module.key_vault.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_services_cms.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "github_action" {
  key_vault_id = module.key_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azuread_group.github_action_iac.object_id

  secret_permissions      = ["Get", "List", ]
  storage_permissions     = []
  certificate_permissions = []
  key_permissions         = []
}

resource "azurerm_key_vault_access_policy" "apim" {
  key_vault_id = module.key_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_api_management.apim_v2.identity[0].principal_id

  secret_permissions      = ["Get", "List", ]
  storage_permissions     = []
  certificate_permissions = []
  key_permissions         = []
}

resource "azurerm_key_vault_access_policy" "managed_identity_infra_ci" {
  key_vault_id = module.key_vault.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azurerm_user_assigned_identity.managed_identity_infra_ci.principal_id

  key_permissions         = ["Get", "List", ]
  secret_permissions      = ["Get", "List", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", ]
}

resource "azurerm_key_vault_access_policy" "managed_identity_infra_cd" {
  key_vault_id = module.key_vault.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azurerm_user_assigned_identity.managed_identity_infra_cd.principal_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Purge", "Recover", ]
}