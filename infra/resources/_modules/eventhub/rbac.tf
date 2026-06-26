resource "azurerm_role_assignment" "cms_fn_event_hub_data_sender" {
  scope                = module.eventhub.namespace_id
  role_definition_name = "Azure Event Hubs Data Sender"
  principal_id         = var.cms_fn_principal_id
  description          = "Allow CMS Function App to send events to all hubs in namespace"
}

resource "azurerm_role_assignment" "cms_fn_staging_slot_event_hub_data_sender" {
  scope                = module.eventhub.namespace_id
  role_definition_name = "Azure Event Hubs Data Sender"
  principal_id         = var.cms_fn_staging_slot_principal_id
  description          = "Allow CMS Function App staging slot to send events to all hubs in namespace"
}
