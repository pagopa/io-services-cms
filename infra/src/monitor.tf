resource "azurerm_monitor_diagnostic_setting" "queue_diagnostic_setting" {
  name                       = "${local.project}-${local.application_basename}-st-queue-ds"
  target_resource_id         = "${module.storage_account.id}/queueServices/default"
  log_analytics_workspace_id = data.azurerm_application_insights.application_insights.workspace_id

  enabled_log {
    category = "StorageWrite"
  }

  metric {
    category = "Capacity"
    enabled  = false
  }
  metric {
    category = "Transaction"
    enabled  = false
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "poison-queue-alert" {
  enabled             = true
  name                = "[${module.storage_account.name}] Messages In Poison Queue"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  scopes              = [module.storage_account.id]
  description         = "Storage Account [${module.storage_account.name}] poison queue contains messages, this happen on multiple failures in message process by the QueueTrigger Azure Functions"
  severity            = 1

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

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
    action_groups = [data.azurerm_monitor_action_group.error_action_group.id]
  }
}