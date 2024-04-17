locals {
  prefix               = "io"
  env_short            = "p"
  location_short       = "itn"
  location             = "italynorth"
  project              = "${local.prefix}-${local.env_short}-${local.location_short}"
  is_prod              = local.env_short == "p" ? true : false
  application_basename = "services-cms"
  srch_snet_cidrs      = ["10.20.135.0/26"]

  tags = {
    CreatedBy   = "Terraform"
    Environment = "Prod"
    Owner       = "IO"
    Source      = "https://github.com/pagopa/io-services-cms"
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
  }
}

