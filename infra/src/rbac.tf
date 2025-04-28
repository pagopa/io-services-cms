data "azurerm_data_factory" "adf" {
  name                = "io-p-data-factory"
  resource_group_name = "io-p-rg-operations"
}

resource "azurerm_role_assignment" "adf_to_cosmos_account_reader" {
  scope                = module.cosmosdb_account.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = data.azurerm_data_factory.adf.identity[0].principal_id
}
