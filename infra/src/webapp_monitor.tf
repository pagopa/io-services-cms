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
