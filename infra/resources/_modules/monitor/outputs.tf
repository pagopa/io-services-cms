output "action_group_ids" {
  value = {
    oncall  = azurerm_monitor_action_group.oncall_action_group.id
    offcall = azurerm_monitor_action_group.offcall_action_group.id
  }
  description = "Ids of the action groups for monitoring"
}
