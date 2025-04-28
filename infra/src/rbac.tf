data "azurerm_data_factory" "adf" {
  name                = "io-p-data-factory"
  resource_group_name = "io-p-rg-operations"
}

resource "azurerm_cosmosdb_sql_role_assignment" "adf_to_cosmos_data_reader_db" {
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = module.cosmosdb_account.name
  role_definition_id  = "${module.cosmosdb_account.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = data.azurerm_data_factory.adf.identity[0].principal_id
  scope               = "${module.cosmosdb_account.id}/dbs/${azurerm_cosmosdb_sql_database.db_cms.name}"
}
