resource "azurerm_monitor_scheduled_query_rules_alert" "poison-queue-alert" {
  name                = "[iopservicescmsst] Messages In Poison Queue"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  severity            = 1
  action {
    action_group = [data.azurerm_monitor_action_group.iopquarantineerror-action-group.id]
  }

  data_source_id = module.storage_account.id

  description = "Storage Account [iopservicescmsst] poison queue contains messages, this happen on multiple failures in message process by the QueueTrigger Azure Functions"

  query = <<-QUERY
    StorageQueueLogs  
    | where OperationName contains "PutMessage" 
    | where Uri contains "-poison"
    | count
  QUERY

  frequency   = "5" // minutes
  time_window = "5" // minutes

  trigger {
    operator  = "GreaterThan"
    threshold = 0
  }
}