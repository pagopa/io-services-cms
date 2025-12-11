###############
# Autoscalers #
###############

module "function_profile_autoscale" {
  source  = "pagopa-dx/azure-app-service-plan-autoscaler/azurerm"
  version = "~> 2.0"

  resource_group_name = module.cms_fn.function_app.resource_group_name
  location            = var.location
  app_service_plan_id = module.cms_fn.function_app.plan.id
  target_service = {
    function_apps = [
      {
        name = module.cms_fn.function_app.function_app.name
      }
    ]
  }

  scheduler = {
    normal_load = {
      minimum = 3
      default = 5
    },
    maximum = 30
  }

  scale_metrics = {
    cpu = {
      upper_threshold           = 65
      statistic_increase        = "Max"
      time_aggregation_increase = "Maximum"
      time_window_increase      = 1
      increase_by               = 2
      cooldown_increase         = 5
      lower_threshold           = 30
      statistic_decrease        = "Average"
      time_aggregation_decrease = "Average"
      time_window_decrease      = 5
      decrease_by               = 1
      cooldown_decrease         = 5
    }
    memory = {
      upper_threshold           = 85
      statistic_increase        = "Average"
      time_aggregation_increase = "Average"
      time_window_increase      = 1
      increase_by               = 1
      cooldown_increase         = 5
    }
    requests = {
      upper_threshold           = 500
      statistic_increase        = "Max"
      time_aggregation_increase = "Maximum"
      time_window_increase      = 1
      increase_by               = 2
      cooldown_increase         = 5
      lower_threshold           = 50
      statistic_decrease        = "Average"
      time_aggregation_decrease = "Average"
      time_window_decrease      = 5
      decrease_by               = 1
      cooldown_decrease         = 5
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

  enabled_metric {
    category = "Capacity"
  }
  enabled_metric {
    category = "Transaction"
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
