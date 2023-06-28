data "azurerm_key_vault_secret" "legacy_cosmosdb_connectionstring" {
  name         = "legacy-cosmosdb-connectionstring"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "legacy_cosmosdb_key" {
  name         = "legacy-cosmosdb-key"
  key_vault_id = module.key_vault_domain.id
}
