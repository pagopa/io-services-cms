module "svc_container_app_environment_itn" {
  source  = "pagopa-dx/azure-container-app-environment/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    app_name        = var.domain
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name

  log_analytics_workspace_id           = var.log_analytics_workspace_id
  private_dns_zone_resource_group_name = local.private_dns_zone_resource_group_name
  subnet_pep_id                        = var.peps_snet_id
  subnet_cidr                          = var.subnet_cidr

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  tags = var.tags
}
