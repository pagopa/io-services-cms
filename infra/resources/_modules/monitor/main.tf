##########
# Alerts #
##########
resource "azurerm_monitor_action_group" "error_action_group" {
  resource_group_name = var.resource_group_name
  name                = "${var.prefix}${var.env_short}-${var.domain}-error-ag-01"
  short_name          = "${var.prefix}${var.env_short}-${var.domain}-error-ag-01"

  webhook_receiver {
    name                    = "callslacksvcmonitor"
    service_uri             = data.azurerm_key_vault_secret.slack_svc_monitor_webhook_url.value
    use_common_alert_schema = true
  }

  webhook_receiver {
    name                    = "callopsgenie"
    service_uri             = "https://api.opsgenie.com/v1/json/azure?apiKey=${data.azurerm_key_vault_secret.opsgenie_svc_api_key.value}"
    use_common_alert_schema = true
  }

  tags = var.tags
}
