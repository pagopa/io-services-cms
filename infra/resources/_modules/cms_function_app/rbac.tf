module "adf_to_blob_data_reader_db" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.0"

  principal_id    = data.azurerm_data_factory.adf.identity[0].principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  storage_blob = [{
    storage_account_name = module.cms_storage_account.name
    resource_group_name  = module.cms_storage_account.resource_group_name
    description          = "To allow migrating the activations of special services's"
    role                 = "writer"
    container_name       = azurerm_storage_container.activations.name
    }
  ]
}
