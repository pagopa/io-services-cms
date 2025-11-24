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
    normal_load = {
      minimum = 3
      default = 8
    },
    maximum = 30
  }

  scale_metrics = {
    cpu = {
      upper_threshold           = 55
      lower_threshold           = 30
      increase_by               = 2
      decrease_by               = 1
      cooldown_increase         = 5
      cooldown_decrease         = 5
      statistic_increase        = "Max"
      statistic_decrease        = "Average"
      time_aggregation_increase = "Maximum"
      time_aggregation_decrease = "Average"
      time_window_increase      = 1
      time_window_decrease      = 5
    }
    memory = {
      upper_threshold           = 85
      increase_by               = 1
      cooldown_increase         = 5
      statistic_increase        = "Average"
      time_aggregation_increase = "Average"
      time_window_increase      = 1
    }
    requests = {
      time_aggregation_increase = "Maximum"
      time_aggregation_decrease = "Average"
      increase_by               = 2
      cooldown_increase         = 5
      decrease_by               = 1
      cooldown_decrease         = 5
      upper_threshold           = 1500
      lower_threshold           = 300
    }
  }

  tags = var.tags
}
