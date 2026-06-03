###############
# Autoscalers #
###############

resource "azurerm_monitor_autoscale_setting" "backoffice" {
  name                = replace(module.backoffice.app_service.app_service.name, "app", "as")
  resource_group_name = module.backoffice.app_service.resource_group_name
  location            = var.location
  target_resource_id  = module.backoffice.app_service.plan.id

  profile {
    name = "default"

    capacity {
      default = local.backoffice.autoscale_settings.default
      minimum = local.backoffice.autoscale_settings.min
      maximum = local.backoffice.autoscale_settings.max
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.backoffice.app_service.app_service.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT1M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 3000
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT1M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.backoffice.app_service.plan.id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 60
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "MemoryPercentage"
        metric_resource_id = module.backoffice.app_service.plan.id
        metric_namespace   = "microsoft.web/serverfarms"
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 85
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.backoffice.app_service.app_service.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT7M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 2000
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.backoffice.app_service.plan.id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT7M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 30
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }

  tags = var.tags
}

##########
# Alerts #
##########

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "api-keys-export-failed" {
  name                = "[${module.backoffice.app_service.app_service.name}] API keys export failed"
  resource_group_name = var.resource_group_name
  scopes              = [data.azurerm_application_insights.ai_common.id]
  location            = var.location
  description         = "Backoffice failed at least an API keys export. The user can retry the export operation. No action is needed."
  severity            = 4

  window_duration      = "PT15M"
  evaluation_frequency = "PT15M"

  criteria {
    query                   = <<-QUERY
      customMetrics
      | where name == "export_count_total"
      | where tostring(customDimensions.state) == "FAILED"
    QUERY
    operator                = "GreaterThan"
    time_aggregation_method = "Count"
    threshold               = 0
  }

  action {
    action_groups = [var.error_action_group_id]
  }

  tags = var.tags
}
