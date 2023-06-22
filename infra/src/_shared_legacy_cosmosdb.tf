variable "legacy_cosmosdb_name" {
  type        = string
  description = "The name of the database where legacy data is"
}

variable "legacy_cosmosdb_uri" {
  type        = string
  description = "The uri of the database where legacy data is"
}

variable "legacy_cosmosdb_container_services" {
  type        = string
  description = "The collection of the database where legacy data is"
  default     = "services"
}

variable "legacy_cosmosdb_container_services_lease" {
  type        = string
  description = "The lease collection that keeps track of our reads to the service collection change feed"
  default     = "services-cms--legacy-watcher-lease"
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_connectionstring" {
  name         = "legacy-cosmosdb-connectionstring"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_key" {
  name         = "legacy-cosmosdb-key"
  key_vault_id = module.key_vault_domain.id
}
