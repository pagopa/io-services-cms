env       = "prod"
env_short = "p"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "IO"
  Source      = "https://github.com/pagopa/io-selfcare-importadesioni"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

## Network
vnet_common_rg = "io-p-rg-common"
vnet_name      = "io-p-vnet-common"
# refer to https://github.com/pagopa/io-infra/blob/main/src/core/env/prod/terraform.tfvars#L26
#  for availble netowrk spaces
cidr_subnet       = "10.0.135.0/26"
cidr_subnet_pgres = "10.0.135.64/26"

## Functions
functions_kind              = "Linux"
functions_sku_tier          = "Standard"
functions_sku_size          = "S1"
functions_autoscale_minimum = 1
functions_autoscale_maximum = 3
functions_autoscale_default = 1

cosmos_private_endpoint_enabled      = true
cosmos_public_network_access_enabled = false


## Monitor
application_insights_name       = "io-p-ai-common"
monitor_resource_group_name     = "io-p-rg-common"
monitor_action_group_email_name = "EmailPagoPA"
monitor_action_group_slack_name = "SlackPagoPA"
