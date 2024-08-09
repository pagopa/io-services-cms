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
  appgateway_snet_name      = "io-p-appgateway-snet"
}

## Network
# refer to https://github.com/pagopa/io-infra/blob/main/src/core/env/prod/terraform.tfvars#L26
#  for availble netowrk spaces
# You can retrieve the list of current defined subnets using the CLI command
# az network vnet subnet list --subscription PROD-IO --vnet-name io-p-vnet-common --resource-group io-p-rg-common --output table
# and thus define new CIDRs according to the unallocated address space
subnets_cidrs = {
  api        = ["10.0.135.0/26"]
  postgres   = ["10.0.135.64/26"]
  backoffice = ["10.0.135.128/26"]
}

cosmos_private_endpoint_enabled      = true
cosmos_public_network_access_enabled = false

## Apim
azure_apim_v2             = "io-p-apim-v2-api"
azure_apim_resource_group = "io-p-rg-internal"
azure_apim_product_id     = "io-services-api"

## PostgreSQL
reviewer_db_name   = "reviewer"
reviewer_db_user   = "reviewerusr"
reviewer_db_schema = "reviewer"
reviewer_db_table  = "service_review"
topic_db_schema    = "taxonomy"
topic_db_table     = "topic"

# Legacy data
legacy_cosmosdb_resource_group = "io-p-rg-internal"
legacy_cosmosdb_resource_name  = "io-p-cosmos-api"
legacy_cosmosdb_name           = "db"

legacy_service_watcher_max_items_per_invocation = 10


# Container App Job
key_vault_common = {
  resource_group_name = "io-p-rg-common"
  name                = "io-p-kv-common"
  pat_secret_name     = "github-runner-pat"
}

container_app_environment = {
  name                = "io-p-github-runner-cae"
  resource_group_name = "io-p-github-runner-rg"
}
