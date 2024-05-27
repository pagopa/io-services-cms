data "azurerm_monitor_action_group" "iopquarantineerror-action-group" {
  resource_group_name = var.io_common.resource_group_name
  name                = "iopquarantineerror"
}

resource "azurerm_monitor_metric_alert" "webapp_functions_app_health_check" {
  name                = "${module.webapp_functions_app.name}-health-check-failed"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [module.webapp_functions_app.id]
  description         = "${module.webapp_functions_app.name} health check failed"
  severity            = 1
  frequency           = "PT5M"
  auto_mitigate       = false
  enabled             = false # todo enable after deploy

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HealthCheckStatus"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 50
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.error_action_group.id
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert" "poison-queue-alert" {
  name                = "io-services-cms-poison-queue"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  action {
    action_group = [data.azurerm_monitor_action_group.iopquarantineerror-action-group.id]
  }

  data_source_id = module.storage_account.id

  description = "Poison queue contains elements, this indicates failure in messages process"

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