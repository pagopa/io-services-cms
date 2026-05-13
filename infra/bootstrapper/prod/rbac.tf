resource "azurerm_role_assignment" "storage_blob_data_contributor_admins" {
  scope                = module.repo.resource_group.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = data.azuread_group.admins.object_id
}

resource "azurerm_role_assignment" "storage_blob_tags_contributor_admins" {
  scope                = module.repo.resource_group.id
  role_definition_name = "PagoPA Storage Blob Tags Contributor"
  principal_id         = data.azuread_group.admins.object_id
}

resource "azurerm_key_vault_access_policy" "infra_cd_kv_common" {
  for_each = toset(local.keyvault_common_ids)

  key_vault_id = each.key
  tenant_id    = data.azurerm_subscription.current.tenant_id
  object_id    = module.repo.identities.infra.cd.principal_id

  secret_permissions = ["Get", "List", "Set"]
}

resource "azurerm_key_vault_access_policy" "infra_ci_kv_common" {
  for_each = toset(local.keyvault_common_ids)

  key_vault_id = each.key
  tenant_id    = data.azurerm_subscription.current.tenant_id
  object_id    = module.repo.identities.infra.ci.principal_id

  secret_permissions = ["Get", "List"]
}
