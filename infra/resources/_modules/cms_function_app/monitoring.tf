###############
# Autoscalers #
###############

resource "azurerm_monitor_autoscale_setting" "cms_fn" {
  name                = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-cms-func-as-01"
  resource_group_name = module.cms_fn.function_app.resource_group_name
  location            = var.location
  target_resource_id  = module.cms_fn.function_app.plan.id

  profile {
    name = "default"

    capacity {
      default = local.cms.autoscale_settings.default
      minimum = local.cms.autoscale_settings.min
      maximum = local.cms.autoscale_settings.max
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.cms_fn.function_app.function_app.id
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
        metric_resource_id       = module.cms_fn.function_app.plan.id
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
        metric_resource_id = module.cms_fn.function_app.plan.id
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
        metric_resource_id       = module.cms_fn.function_app.function_app.id
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
        metric_resource_id       = module.cms_fn.function_app.plan.id
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

// Storage Account Alerts

resource "azurerm_monitor_diagnostic_setting" "queue_diagnostic_setting" {
  name                       = "${var.prefix}-${var.env_short}-${var.location_short}-${var.domain}-cms-st-queue-ds-01"
  target_resource_id         = "${module.cms_storage_account.id}/queueServices/default"
  log_analytics_workspace_id = data.azurerm_application_insights.ai_common.workspace_id

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
  name                = "[${module.cms_storage_account.name}] Messages In Poison Queue"
  resource_group_name = var.resource_group_name
  location            = var.location
  scopes              = [module.cms_storage_account.id]
  description         = "Storage Account [${module.cms_storage_account.name}] poison queue contains messages, this happen on multiple failures in message process by the QueueTrigger Azure Functions"
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
    action_groups = [var.error_action_group_id]
  }
}
