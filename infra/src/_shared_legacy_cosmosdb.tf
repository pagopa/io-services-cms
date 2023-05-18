variable "legacy_cosmosdb_name" {
  type        = string
  description = "The name of the database where legacy data is"
}

variable "legacy_cosmosdb_services_collection" {
  type        = string
  description = "The collection of the database where legacy data is"
  default     = "services"
}

variable "legacy_cosmosdb_services_lease_collection" {
  type        = string
  description = "The lease collection that keeps track of our reads to the service collection change feed"
  default     = "services-cms--legacy-watcher-lease"
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_connectionstring" {
  name         = "legacy-cosmosdb-connectionstring"
  key_vault_id = module.key_vault_domain.id
}
