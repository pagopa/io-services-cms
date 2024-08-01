#################
#  App Service  #
#################

module "backoffice" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "backoffice"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/info"
  node_version        = 18

  subnet_cidr                          = local.backoffice.snet_cidr
  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings = merge(local.backoffice.base_app_settings, local.backoffice.prod_app_setting)

  slot_app_settings = merge(local.backoffice.base_app_settings, local.backoffice.staging_app_setting)

  sticky_app_setting_names = local.backoffice.sticky_settings

  tier = local.backoffice.tier

  tags = var.tags
}