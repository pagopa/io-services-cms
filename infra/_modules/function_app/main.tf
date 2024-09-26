##################
#  Function App  #
##################

module "app_be_fn" {
  source = "github.com/pagopa/dx//infra/modules/azure_function_app?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "app-be"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/info"
  node_version        = 18

  subnet_cidr                          = var.app_be_snet_cidr
  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  action_group_id = data.azurerm_monitor_action_group.error_action_group.id

  app_settings      = local.app_be.app_settings
  slot_app_settings = local.app_be.app_settings

  tier = local.app_be.tier

  application_insights_connection_string = data.azurerm_application_insights.ai_common.connection_string

  tags = var.tags
}
