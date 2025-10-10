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

module "rbac_app_be_fn_staging_slot" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  subscription_id = data.azurerm_subscription.current.subscription_id
  principal_id    = module.app_be_fn.function_app.function_app.slot.principal_id

  cosmos = [{
    account_name        = data.azurerm_cosmosdb_account.cosmos.name
    resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
    description         = "Allow Function App Staging Slot to readonly access CosmosDB"
    role                = "reader"
    database            = local.app_be.cosmosdb_name
    collections         = ["services"] // TODO: refactor with a local variable
    }
  ]

  storage_blob = [{
    storage_account_name = module.storage_account.name
    resource_group_name  = module.storage_account.resource_group_name
    description          = "Allow Function App Staging Slot to readonly access Blob Storage"
    role                 = "reader"
    container_name       = "static-content" // TODO: refactor with a local variable
    }
  ]
}
