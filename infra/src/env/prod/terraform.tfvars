env       = "prod"
env_short = "p"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "IO"
  Source      = "https://github.com/pagopa/io-services-cms"
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
functions_sku_tier          = "PremiumV3"
functions_sku_size          = "P1v3"
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

## Jira
jira_namespace_url                  = "https://pagopa.atlassian.net"
jira_project_name                   = "IEST"
jira_username                       = "io-pagopa-github-bot@pagopa.it"
jira_contract_custom_field          = "customfield_10365"
jira_delegate_email_custom_field    = "customfield_10383"
jira_delegate_name_custom_field     = "customfield_10382"
jira_organization_cf_custom_field   = "customfield_10364"
jira_organization_name_custom_field = "customfield_10381"

## Apim
azure_apim                = "io-p-apim-api"
azure_apim_resource_group = "io-p-rg-internal"

## PostgreSQL
reviewer_db_name   = "reviewer"
reviewer_db_schema = "reviewer"
reviewer_db_table  = "service_review"

# Legacy data
legacy_cosmosdb_name = "db"
legacy_cosmosdb_uri  = "https://io-p-cosmos-api.documents.azure.com:443/"