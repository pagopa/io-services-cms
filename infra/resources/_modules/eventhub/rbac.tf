locals {
  cms_event_hub_names = [
    for eventhub in local.evhns.eventhubs : replace(module.eventhub.name, "-evhns-", "-${eventhub.name}-")
  ]

  cms_event_hub_ids = {
    for event_hub_name in local.cms_event_hub_names : event_hub_name => module.eventhub.hub_ids[event_hub_name]
  }
}

resource "azurerm_role_assignment" "cms_fn_event_hub_data_sender" {
  for_each = local.cms_event_hub_ids

  scope                = each.value
  role_definition_name = "Azure Event Hubs Data Sender"
  principal_id         = var.cms_fn_principal_id
  description          = "Allow CMS Function App to send service ingestion events"
}

resource "azurerm_role_assignment" "cms_fn_staging_slot_event_hub_data_sender" {
  for_each = local.cms_event_hub_ids

  scope                = each.value
  role_definition_name = "Azure Event Hubs Data Sender"
  principal_id         = var.cms_fn_staging_slot_principal_id
  description          = "Allow CMS Function App staging slot to send service ingestion events"
}