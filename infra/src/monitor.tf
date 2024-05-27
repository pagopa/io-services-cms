resource "azurerm_monitor_diagnostic_setting" "queue_diagnostic_setting" {
  name                       = "${local.project}-${local.application_basename}-st-queue-ds"
  target_resource_id         = "${module.storage_account.id}/queueServices/default"
  log_analytics_workspace_id = data.azurerm_application_insights.application_insights.workspace_id

  enabled_log {
    category = "StorageWrite"
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert" "poison-queue-alert" {
  name                = "[${upper(local.application_basename)}] Messages In Poison Queue"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  severity            = 0
  action {
    action_group = [data.azurerm_monitor_action_group.iopquarantineerror_action_group.id]
  }

  data_source_id = module.storage_account.id

  description = "Storage Account [${module.storage_account.name}] poison queue contains messages, this happen on multiple failures in message process by the QueueTrigger Azure Functions"

  query = <<-QUERY
    StorageQueueLogs  
    | where OperationName contains "PutMessage" 
    | where Uri contains "-poison"
    | distinct Uri
    | project QueueName = split(Uri, "/", 3)
  QUERY

  frequency   = "5" // minutes
  time_window = "5" // minutes

  trigger {
    operator  = "GreaterThan"
    threshold = 0
  }
}