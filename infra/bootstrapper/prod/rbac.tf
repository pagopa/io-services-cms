resource "azurerm_role_assignment" "storage_blob_data_contributor_admins" {
  scope                = module.repo.resource_group.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = data.azuread_group.admins.object_id
}
