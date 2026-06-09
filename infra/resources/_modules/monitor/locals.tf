locals {
  key_vault = {
    secrets_name = {
      slack_svc_monitor_email = "slack-svc-monitor-email"
      incident_mgmt_api_key   = "incident-mgmt-api-key"
    }
  }
  incident_mgmt_system = {
    service_uri = "https://api.atlassian.com/jsm/ops/integration/v1/json/azure?apiKey=${data.azurerm_key_vault_secret.incident_mgmt_api_key.value}"
  }
}
