locals {
  cms_event_hub_names = [
    for eventhub in local.evhns.eventhubs : replace(module.eventhub.name, "-evhns-", "-${eventhub.name}-")
  ]
}

module "cms_fn_event_hub_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  principal_id    = var.cms_fn_principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  event_hub = [{
    namespace_name      = module.eventhub.name
    resource_group_name = var.resource_group_name
    event_hub_names     = local.cms_event_hub_names
    role                = "writer"
    description         = "Allow CMS Function App to send service ingestion events"
  }]
}

module "cms_fn_staging_slot_event_hub_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  principal_id    = var.cms_fn_staging_slot_principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  event_hub = [{
    namespace_name      = module.eventhub.name
    resource_group_name = var.resource_group_name
    event_hub_names     = local.cms_event_hub_names
    role                = "writer"
    description         = "Allow CMS Function App staging slot to send service ingestion events"
  }]
}