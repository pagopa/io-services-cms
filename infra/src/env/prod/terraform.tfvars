env_short = "p"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "IO"
  Source      = "https://github.com/pagopa/io-services-cms"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

io_common = {
  resource_group_name       = "io-p-rg-common"
  vnet_name                 = "io-p-vnet-common"
  application_insights_name = "io-p-ai-common"
  action_group_email_name   = "EmailPagoPA"
  action_group_slack_name   = "SlackPagoPA"
}

cosmos_private_endpoint_enabled      = false
cosmos_public_network_access_enabled = false
