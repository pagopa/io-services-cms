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


# Backoffice Configurations
backoffice_host = "selfcare.io.pagopa.it"
backoffice_app = {
  sku_name                                  = "P1v3"
  apim_user_groups                          = "apimessagewrite,apiinforead,apimessageread,apilimitedprofileread,apiservicewrite"
  azure_credentials_scope_url               = "https://management.azure.com/.default"
  azure_apim_subscriptions_api_base_url     = "https://management.azure.com/subscriptions/"
  selfcare_external_api_base_url            = "https://api.selfcare.pagopa.it/external/v2"
  selfcare_jwks_path                        = "/.well-known/jwks.json"
  subscription_migration_api_url            = "https://io-p-subsmigrations-fn.azurewebsites.net/api/v1"
  api_services_cms_topics_cache_ttl_minutes = "60"
}

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
