###############
# Autoscalers #
###############

module "function_profile_autoscale" {
  source  = "pagopa-dx/azure-app-service-plan-autoscaler/azurerm"
  version = "~> 2.0"

  resource_group_name = module.app_be_fn.function_app.resource_group_name
  location            = var.location
  app_service_plan_id = module.app_be_fn.function_app.plan.id
  target_service = {
    function_apps = [
      {
        name = module.app_be_fn.function_app.function_app.name
      }
    ]
  }

  scheduler = {
    high_load = {
      name    = "high_load_profile"
      minimum = 3
      default = 12
      start = {
        hour    = 19
        minutes = 30
      }
      end = {
        hour    = 22
        minutes = 59
      }
    },
    normal_load = {
      minimum = 3
      default = 11
    },
    maximum = 30
  }

  scale_metrics = {
    requests = {
      statistic_increase        = "Max"
      time_window_increase      = 1
      time_aggregation          = "Maximum"
      upper_threshold           = 2000
      increase_by               = 2
      cooldown_increase         = 3
      statistic_decrease        = "Average"
      time_window_decrease      = 5
      time_aggregation_decrease = "Average"
      lower_threshold           = 500
      decrease_by               = 1
      cooldown_decrease         = 5
    }
    cpu = {
      upper_threshold           = 40
      lower_threshold           = 15
      increase_by               = 2
      decrease_by               = 1
      cooldown_increase         = 3
      cooldown_decrease         = 5
      statistic_increase        = "Max"
      statistic_decrease        = "Average"
      time_aggregation_increase = "Maximum"
      time_aggregation_decrease = "Average"
      time_window_increase      = 1
      time_window_decrease      = 5
    }
    memory = null
  }

  tags = var.tags
}
