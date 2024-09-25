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
          minimum = local.app_be.autoscale_settings.min
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
          minimum = local.app_be.autoscale_settings.min
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
          minimum = local.app_be.autoscale_settings.min
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
          metric_resource_id = module.app_be_fn.function_app.plan.id
          metric_namespace   = "microsoft.web/serverfarms"
          time_grain         = "PT1M"
          statistic          = "Average"
          time_window        = "PT5M"
          time_aggregation   = "Average"
          operator           = "GreaterThan"
          threshold          = 80
        }
        scale_action {
          direction = "Increase"
          type      = "ChangeCount"
          value     = "1"
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
          metric_resource_id       = module.app_be_fn.function_app.plan.id
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

      rule {
        metric_trigger {
          metric_name        = "MemoryPercentage"
          metric_resource_id = module.app_be_fn.function_app.plan.id
          metric_namespace   = "microsoft.web/serverfarms"
          time_grain         = "PT1M"
          statistic          = "Average"
          time_window        = "PT7M"
          time_aggregation   = "Average"
          operator           = "LessThan"
          threshold          = 30
        }
        scale_action {
          direction = "Decrease"
          type      = "ChangeCount"
          value     = "1"
          cooldown  = "PT5M"
        }
      }
    }
  }

  tags = var.tags
}
