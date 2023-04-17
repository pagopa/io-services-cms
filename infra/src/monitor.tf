## Monitor
variable "application_insights_name" {
  type        = string
  description = "The common Application Insights name"
  default     = ""
}

variable "monitor_resource_group_name" {
  type        = string
  description = "Monitor resource group name"
}

variable "monitor_action_group_email_name" {
  type        = string
  description = "The email to send alerts to"
}

variable "monitor_action_group_slack_name" {
  type        = string
  description = "The slack channel to send alerts to"
}

data "azurerm_application_insights" "application_insights" {
  name                = var.application_insights_name
  resource_group_name = var.monitor_resource_group_name
}

data "azurerm_monitor_action_group" "slack" {
  resource_group_name = var.monitor_resource_group_name
  name                = var.monitor_action_group_slack_name
}

data "azurerm_monitor_action_group" "email" {
  resource_group_name = var.monitor_resource_group_name
  name                = var.monitor_action_group_email_name
}

data "azurerm_monitor_action_group" "error_action_group" {
  resource_group_name = var.monitor_resource_group_name
  name                = "${var.prefix}${var.env_short}error"
}
