##########
# Alerts #
##########

resource "azurerm_monitor_metric_alert" "srch_high_latency" {
  name                = "[${azurerm_search_service.srch.name}] High Latency"
  resource_group_name = azurerm_search_service.srch.resource_group_name
  scopes              = [azurerm_search_service.srch.id]
  description         = "The maximum latency is greater than 1s. Runbook: https://pagopa.atlassian.net/wiki/spaces/IOPAE/pages/1119453217"
  severity            = 1
  window_size         = "PT5M"
  frequency           = "PT5M"
  auto_mitigate       = false

  criteria {
    metric_namespace = "Microsoft.Search/searchServices"
    metric_name      = "SearchLatency"
    aggregation      = "Maximum"
    operator         = "GreaterThan"
    threshold        = 1
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.error_action_group.id
  }

  tags = var.tags
}
