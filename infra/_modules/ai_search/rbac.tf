resource "azurerm_role_assignment" "search_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = azurerm_search_service.srch.identity[0].principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "search_to_cosmos_data_reader" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = azurerm_search_service.srch.identity[0].principal_id
  scope               = data.azurerm_cosmosdb_account.cosmos.id
}

resource "azurerm_cosmosdb_sql_role_assignment" "search_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = azurerm_search_service.srch.identity[0].principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.cosmos_database_name}"
}

resource "azurerm_cosmosdb_sql_role_assignment" "search_to_cosmos_data_reader_db_colls" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = azurerm_search_service.srch.identity[0].principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.cosmos_database_name}/colls/services-publication"
}

resource "azurerm_role_assignment" "developers_group_to_ai_search_reader" {
  scope                = azurerm_search_service.srch.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = data.azuread_group.adgroup_services_cms.object_id
}