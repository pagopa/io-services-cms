resource "azurerm_role_assignment" "app_be_fn_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn.function_app.function_app.principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn.function_app.function_app.principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.app_be.cosmosdb_name}"
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn.function_app.function_app.slot.principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_staging_slot_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn.function_app.function_app.slot.principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.app_be.cosmosdb_name}"
}

resource "azurerm_role_assignment" "app_be_fn_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn.function_app.function_app.principal_id
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn.function_app.function_app.slot.principal_id
}
