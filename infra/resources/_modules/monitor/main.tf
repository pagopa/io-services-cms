##########
# Alerts #
##########
resource "azurerm_monitor_action_group" "offcall_action_group" {
  resource_group_name = var.resource_group_name
  name                = "${var.prefix}-${var.env_short}-${var.domain}-offcall-ag-01"
  short_name          = "${var.domain}-offcall"

  email_receiver {
    name                    = "SendToSlack"
    email_address           = data.azurerm_key_vault_secret.slack_svc_monitor_email.value
    use_common_alert_schema = true
  }

  tags = var.tags
}

resource "azurerm_monitor_action_group" "oncall_action_group" {
  resource_group_name = var.resource_group_name
  name                = "${var.prefix}-${var.env_short}-${var.domain}-oncall-ag-01"
  short_name          = "${var.domain}-oncall"

  webhook_receiver {
    name                    = "SendToIncidentManagementService"
    service_uri             = local.incident_mgmt_system.service_uri
    use_common_alert_schema = true
  }

  email_receiver {
    name                    = "SendToSlack"
    email_address           = data.azurerm_key_vault_secret.slack_svc_monitor_email.value
    use_common_alert_schema = true
  }

  tags = var.tags
}
