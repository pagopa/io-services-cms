
data "azurerm_monitor_action_group" "iopquarantineerror-action-group" {
  resource_group_name = var.io_common.resource_group_name
  name                = "iopquarantineerror"
}