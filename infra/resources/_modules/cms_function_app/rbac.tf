module "function_app_to_blob_data_writer" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.0"

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
}

module "function_app_staging_slot_to_blob_data_writer" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.0"
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
}
