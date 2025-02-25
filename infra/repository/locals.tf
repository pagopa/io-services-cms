locals {
  prefix          = "io"
  env_short       = "p"
  location        = "italynorth"
  domain          = "svc"
  instance_number = "01"

  adgroups = {
    admins_name = "io-p-adgroup-svc-admins"
    devs_name   = "io-p-adgroup-svc-developers"
  }

  runner = {
    cae_name                = "${local.prefix}-${local.env_short}-itn-github-runner-cae-01"
    cae_resource_group_name = "${local.prefix}-${local.env_short}-itn-github-runner-rg-01"
    secret = {
      kv_name                = "${local.prefix}-${local.env_short}-kv-common"
      kv_resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
    }
  }

  apim = {
    name                = "${local.prefix}-${local.env_short}-apim-v2-api"
    resource_group_name = "${local.prefix}-${local.env_short}-rg-internal"
  }

  apim_itn = {
    name                = "${local.prefix}-${local.env_short}-itn-apim-01"
    resource_group_name = "${local.prefix}-${local.env_short}-itn-common-rg-01"
  }

  vnet = {
    name                = "${local.prefix}-${local.env_short}-itn-common-vnet-01"
    resource_group_name = "${local.prefix}-${local.env_short}-itn-common-rg-01"
  }

  dns = {
    resource_group_name = "${local.prefix}-${local.env_short}-rg-external"
  }

  dns_zones = {
    resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
  }

  tf_storage_account = {
    name                = "iopitntfst001"
    resource_group_name = "terraform-state-rg"
  }

  repository = {
    name                     = "io-services-cms"
    description              = "The subsystem for Institutions to manage their services into the IO App"
    topics                   = ["services-cms"]
    reviewers_teams          = ["io-platform-green-unit", "engineering-team-cloud-eng"]
    default_branch_name      = "master"
    infra_cd_policy_branches = ["master"]
    opex_cd_policy_branches  = ["master"]
    app_cd_policy_branches   = ["master"]
    app_cd_policy_tags       = ["io-services-app-backend@*", "io-services-cms-backoffice@*", "io-services-cms-webapp@*"]
  }

  key_vault = {
    name                = "io-p-kv-common"
    resource_group_name = "io-p-rg-common"
  }

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    BusinessUnit   = "App IO"
    ManagementTeam = "IO Enti & Servizi"
    Source         = "https://github.com/pagopa/io-services-cms/blob/main/infra/repository"
    CostCenter     = "TS000 - Tecnologia e Servizi"
  }
}
