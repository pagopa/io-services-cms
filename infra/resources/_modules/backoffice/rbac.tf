###################
# RBAC Production #
###################
module "bo_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  principal_id    = module.backoffice.app_service.app_service.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  apim = [{
    name                = data.azurerm_api_management.apim_itn.name
    resource_group_name = data.azurerm_api_management.apim_itn.resource_group_name
    description         = "To allow interaction with APIM"
    role                = "owner"
  }]
  storage_blob = [{
    storage_account_name = module.bo_ext_storage_account.name
    resource_group_name  = module.bo_ext_storage_account.resource_group_name
    description          = "To allow managing blobs in the delegated access storage account"
    role                 = "writer"
    container_name       = local.containers["exports_api-keys"].name
    }
  ]
}

resource "azurerm_role_assignment" "bo_storage_blob_delegator" {
  scope                = module.bo_ext_storage_account.id
  role_definition_name = "Storage Blob Delegator"
  principal_id         = module.backoffice.app_service.app_service.principal_id
  description          = "Allow to create SAS tokens in the delegated access storage account"
}


################
# RBAC Staging #
################
module "bo_staging_slot_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2"
  principal_id    = module.backoffice.app_service.app_service.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  apim = [{
    name                = data.azurerm_api_management.apim_itn.name
    resource_group_name = data.azurerm_api_management.apim_itn.resource_group_name
    description         = "To allow interaction with APIM"
    role                = "owner"
  }]
  storage_blob = [{
    storage_account_name = module.bo_ext_storage_account.name
    resource_group_name  = module.bo_ext_storage_account.resource_group_name
    description          = "To allow managing blobs in the delegated access storage account"
    role                 = "writer"
    container_name       = local.containers["exports_api-keys"].name
    }
  ]
}

resource "azurerm_role_assignment" "bo_staging_slot_storage_blob_delegator" {
  scope                = module.bo_ext_storage_account.id
  role_definition_name = "Storage Blob Delegator"
  principal_id         = module.backoffice.app_service.app_service.slot.principal_id
  description          = "Allow to create SAS tokens in the delegated access storage account"
}
