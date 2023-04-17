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
cidr_subnet = "10.0.135.0/26"