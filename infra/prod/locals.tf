locals {
  prefix               = "io"
  env_short            = "p"
  location_short       = "itn"
  location             = "italynorth"
  project              = "${local.prefix}-${local.env_short}-${local.location_short}"
  application_basename = "svc"
  domain               = "svc"
  # Picked as the first available non-allocated CIDR from the io-p-itn-common-vnet-01
  srch_snet_cidrs  = ["10.20.4.0/26"]
  app_be_snet_cidr = "10.20.5.0/24"
  bo_snet_cidr     = "10.20.11.0/24"
  cms_snet_cidr    = "10.20.9.0/24"

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "IO"
    ManagementTeam = "IO Enti & Servizi"
    Source         = "https://github.com/pagopa/io-services-cms/infra/prod/italynorth"
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
  }
}

