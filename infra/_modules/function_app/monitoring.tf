###############
# Autoscalers #
###############

resource "azurerm_monitor_autoscale_setting" "app_be_fn" {
  name                = format("%s-autoscale", module.app_be_fn.function_app.function_app.name)
  resource_group_name = module.app_be_fn.function_app.resource_group_name
  location            = var.location
  target_resource_id  = module.app_be_fn.function_app.plan.id

  # Scaling strategy
  # 05 - 19,30 -> min 3
  # 19,30 - 23 -> min 4
  # 23 - 05 -> min 2
  dynamic "profile" {
    for_each = [
      {
        name = "{\"name\":\"default\",\"for\":\"evening\"}",

        recurrence = {
          hours   = 22
          minutes = 59
        }

        capacity = {
          default = local.app_be.autoscale_settings.default + 1
          minimum = local.app_be.autoscale_settings.min + 1
          maximum = local.app_be.autoscale_settings.max
        }
      },
      {
        name = "{\"name\":\"default\",\"for\":\"night\"}",

        recurrence = {
          hours   = 5
          minutes = 0
        }

        capacity = {
          default = local.app_be.autoscale_settings.default + 1
          minimum = local.app_be.autoscale_settings.min + 1
          maximum = local.app_be.autoscale_settings.max
        }
      },
      {
        name = "evening"

        recurrence = {
          hours   = 19
          minutes = 30
        }

        capacity = {
          default = local.app_be.autoscale_settings.default + 2
          minimum = local.app_be.autoscale_settings.min + 2
          maximum = local.app_be.autoscale_settings.max
        }
      },
      {
        name = "night"

        recurrence = {
          hours   = 23
          minutes = 0
        }

        capacity = {
          default = local.app_be.autoscale_settings.default
          minimum = local.app_be.autoscale_settings.min
          maximum = local.app_be.autoscale_settings.max
        }
      }
    ]
    iterator = profile_info

    content {
      name = profile_info.value.name

      dynamic "recurrence" {
        for_each = profile_info.value.recurrence != null ? [profile_info.value.recurrence] : []
        iterator = recurrence_info

        content {
          timezone = "W. Europe Standard Time"
          hours    = [recurrence_info.value.hours]
          minutes  = [recurrence_info.value.minutes]
          days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ]
        }
      }

      capacity {
        default = profile_info.value.capacity.default
        minimum = profile_info.value.capacity.minimum
        maximum = profile_info.value.capacity.maximum
      }

      rule {
        metric_trigger {
          metric_name              = "Requests"
          metric_resource_id       = module.app_be_fn.function_app.function_app.id
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
          metric_resource_id       = module.app_be_fn.function_app.plan.id
          metric_namespace         = "microsoft.web/serverfarms"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT5M"
          time_aggregation         = "Average"
          operator                 = "GreaterThan"
          threshold                = 45
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
          metric_name              = "Requests"
          metric_resource_id       = module.app_be_fn.function_app.function_app.id
          metric_namespace         = "microsoft.web/sites"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT15M"
          time_aggregation         = "Average"
          operator                 = "LessThan"
          threshold                = 2000
          divide_by_instance_count = false
        }

        scale_action {
          direction = "Decrease"
          type      = "ChangeCount"
          value     = "1"
          cooldown  = "PT10M"
        }
      }

      rule {
        metric_trigger {
          metric_name              = "CpuPercentage"
          metric_resource_id       = module.app_be_fn.function_app.plan.id
          metric_namespace         = "microsoft.web/serverfarms"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT15M"
          time_aggregation         = "Average"
          operator                 = "LessThan"
          threshold                = 30
          divide_by_instance_count = false
        }

        scale_action {
          direction = "Decrease"
          type      = "ChangeCount"
          value     = "1"
          cooldown  = "PT10M"
        }
      }
    }
  }

  tags = var.tags
}


##########
# Alerts #
##########

resource "azurerm_monitor_metric_alert" "app_be_fn_health_check" {
  name                = "${module.app_be_fn.function_app.function_app.name}-health-check-failed"
  resource_group_name = module.app_be_fn.function_app.resource_group_name
  scopes              = [module.app_be_fn.function_app.function_app.id]
  description         = "${module.app_be_fn.function_app.function_app.name} health check failed"
  severity            = 1
  frequency           = "PT5M"
  auto_mitigate       = false

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

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "app_be_fn_st_low_availability" {
  name                = "[${module.app_be_fn.storage_account.name}] Low Availability"
  resource_group_name = module.app_be_fn.function_app.resource_group_name
  scopes              = [module.app_be_fn.storage_account.id]
  description         = "The average availability is less than 99.8%. Runbook: not needed."
  severity            = 0
  window_size         = "PT5M"
  frequency           = "PT5M"
  auto_mitigate       = false

  # Metric info
  # https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/metrics-supported#microsoftstoragestorageaccounts
  criteria {
    metric_namespace       = "Microsoft.Storage/storageAccounts"
    metric_name            = "Availability"
    aggregation            = "Average"
    operator               = "LessThan"
    threshold              = 99.8
    skip_metric_validation = false
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.error_action_group.id
  }

  tags = var.tags
}
