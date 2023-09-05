data "azurerm_application_insights" "application_insights" {
  name                = var.io_common.application_insights_name
  resource_group_name = var.io_common.resource_group_name
}

data "azurerm_monitor_action_group" "slack" {
  resource_group_name = var.io_common.resource_group_name
  name                = var.io_common.action_group_slack_name
}

data "azurerm_monitor_action_group" "email" {
  resource_group_name = var.io_common.resource_group_name
  name                = var.io_common.action_group_email_name
}

data "azurerm_monitor_action_group" "error_action_group" {
  resource_group_name = var.io_common.resource_group_name
  name                = "${var.prefix}${var.env_short}error"
}
