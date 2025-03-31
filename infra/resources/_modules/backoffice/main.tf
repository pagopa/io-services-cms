#################
#  App Service  #
#################

module "backoffice" {
  source  = "pagopa-dx/azure-app-service/azurerm"
  version = "~> 0.1.5"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "bo"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/info"
  node_version        = 18

  subnet_cidr                          = var.bo_snet_cidr
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