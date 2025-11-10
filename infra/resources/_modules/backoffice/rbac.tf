module "bo_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  principal_id    = module.backoffice.app_service.app_service.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  apim = [{
    name                = data.azurerm_api_management.apim_itn.name
    resource_group_name = data.azurerm_api_management.apim_itn.resource_group_name
    description         = "To allow interaction with APIM"
    role                = "writer"
  }]
}

module "bo_staging_slot_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2"
  principal_id    = module.backoffice.app_service.app_service.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  apim = [{
    name                = data.azurerm_api_management.apim_itn.name
    resource_group_name = data.azurerm_api_management.apim_itn.resource_group_name
    description         = "To allow interaction with APIM"
    role                = "writer"
  }]
}
