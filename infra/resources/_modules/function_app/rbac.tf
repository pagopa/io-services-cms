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

module "rbac_app_be_fn" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  subscription_id = data.azurerm_subscription.current.subscription_id
  principal_id    = module.app_be_fn.function_app.function_app.principal_id

  cosmos = [{
    account_name        = data.azurerm_cosmosdb_account.cosmos.name
    resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
    description         = "Allow Function App to readonly access CosmosDB"
    role                = "reader"
    database            = local.app_be.cosmosdb_name
    collections         = ["services"] // TODO: refactor with a local variable
    }
  ]

  storage_blob = [{
    storage_account_name = module.storage_account.name
    resource_group_name  = module.storage_account.resource_group_name
    description          = "Allow Function App to readonly access Blob Storage"
    role                 = "reader"
    container_name       = "static-content" // TODO: refactor with a local variable
    }
  ]
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
