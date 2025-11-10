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
  apim = [{
    name                = local.apim.name
    resource_group_name = local.apim.resource_group_name
    description         = "To allow Function App to work with APIM"
    role                = "writer"
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
  apim = [{
    name                = local.apim.name
    resource_group_name = local.apim.resource_group_name
    description         = "To allow Function App (staging slot) to work with APIM"
    role                = "writer"
  }]
}
