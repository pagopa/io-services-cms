##########
# Alerts #
##########
resource "azurerm_monitor_action_group" "offcall_action_group" {
  resource_group_name = var.resource_group_name
  name                = "${var.prefix}-${var.env_short}-${var.domain}-offcall-ag-01"
  short_name          = "${var.domain}-error-ag"

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
  short_name          = "${var.domain}-oncall-ag"

  webhook_receiver {
    name                    = "CallOpsgenie"
    service_uri             = "https://api.opsgenie.com/v1/json/azure?apiKey=${data.azurerm_key_vault_secret.opsgenie_svc_api_key.value}"
    use_common_alert_schema = true
  }

  email_receiver {
    name                    = "SendToSlack"
    email_address           = data.azurerm_key_vault_secret.slack_svc_monitor_email.value
    use_common_alert_schema = true
  }

  tags = var.tags
}
