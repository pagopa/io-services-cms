module "cms_fn_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  principal_id    = module.cms_fn.function_app.function_app.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  storage_blob = [{
    storage_account_name = module.cms_storage_account.name
    resource_group_name  = module.cms_storage_account.resource_group_name
    description          = "To allow migrating the activations of special services's"
    role                 = "writer"
    container_name       = local.containers.activations.name
    }
  ]
  storage_queue = [{
    storage_account_name = module.cms_storage_account.name
    resource_group_name  = module.cms_storage_account.resource_group_name
    description          = "Allow Function App to process internal workflow queues and poison queues"
    role                 = "owner"
  }]
  cosmos = [
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
      description         = "Allow Function App to read/write CMS documents and change feed lease containers"
      role                = "writer"
      database            = local.cms.cosmosdb_name
    },
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
      description         = "Allow Function App to write app-backend service detail documents"
      role                = "writer"
      database            = "app-backend"
      collections         = ["services"]
    },
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos_legacy.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos_legacy.resource_group_name
      description         = "Allow Function App to read legacy change feeds and manage lease containers"
      role                = "writer"
      database            = "db"
    }
  ]
  apim = [{
    name                = local.apim.name
    resource_group_name = local.apim.resource_group_name
    description         = "To allow Function App to work with APIM"
    role                = "owner"
  }]
}

module "cms_fn_staging_slot_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2"
  principal_id    = module.cms_fn.function_app.function_app.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  storage_blob = [{
    storage_account_name = module.cms_storage_account.name
    resource_group_name  = module.cms_storage_account.resource_group_name
    description          = "To allow migrating the activations of special services's"
    role                 = "writer"
    container_name       = local.containers.activations.name
    }
  ]
  storage_queue = [{
    storage_account_name = module.cms_storage_account.name
    resource_group_name  = module.cms_storage_account.resource_group_name
    description          = "Allow Function App staging slot to process internal workflow queues and poison queues"
    role                 = "owner"
  }]
  cosmos = [
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
      description         = "Allow Function App staging slot to read/write CMS documents and change feed lease containers"
      role                = "writer"
      database            = local.cms.cosmosdb_name
    },
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
      description         = "Allow Function App staging slot to write app-backend service detail documents"
      role                = "writer"
      database            = "app-backend"
      collections         = ["services"]
    },
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos_legacy.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos_legacy.resource_group_name
      description         = "Allow Function App staging slot to read legacy change feeds and manage lease containers"
      role                = "writer"
      database            = "db"
    }
  ]
  apim = [{
    name                = local.apim.name
    resource_group_name = local.apim.resource_group_name
    description         = "To allow Function App (staging slot) to work with APIM"
    role                = "owner"
  }]
}
