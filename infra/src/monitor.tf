resource "azurerm_monitor_diagnostic_setting" "queue_diagnostic_setting" {
  name                       = "${local.project}-${local.application_basename}-st-queue-ds"
  target_resource_id         = "${module.storage_account.id}/queueServices/default"
  log_analytics_workspace_id = data.azurerm_application_insights.application_insights.workspace_id

  enabled_log {
    category = "StorageWrite"
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "poison-queue-alert" {
  enabled             = true
  name                = "[${upper(local.application_basename)}] Messages In Poison Queue"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  scopes              = [module.storage_account.id]
  description         = "Storage Account [${module.storage_account.name}] poison queue contains messages, this happen on multiple failures in message process by the QueueTrigger Azure Functions"
  severity            = 0

  // check once every 5 minutes(evaluation_frequency)
  // on the last 10 minutes of data(window_duration)
  evaluation_frequency = "PT5M"
  window_duration      = "PT10M"

  mute_actions_after_alert_duration = "PT5M"

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs  
      | where OperationName contains "PutMessage" 
      | where Uri contains "-poison"
      | distinct Uri
      | project QueueName = split(Uri, "/")[3]
    QUERY
    operator                = "GreaterThan"
    time_aggregation_method = "Count"
    threshold               = 0
  }

  action {
    action_groups = [data.azurerm_monitor_action_group.iopquarantineerror_action_group.id]
  }
}