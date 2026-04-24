output "id" {
  value       = module.ext_storage_account.id
  description = "Id of the delegated access storage account"
}

output "name" {
  value       = module.ext_storage_account.name
  description = "Name of the delegated access storage account"
}

output "resource_group_name" {
  value       = module.ext_storage_account.resource_group_name
  description = "Resource group name of the delegated access storage account"
}

output "blob" {
  value = {
    primary_blob_endpoint = module.ext_storage_account.primary_blob_endpoint
    containers = {
      api_keys = {
        name = local.containers.api_keys.name
      }
    }
  }
  description = "Blob storage configuration for the delegated access storage account"
}
