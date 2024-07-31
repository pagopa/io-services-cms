resource "azurerm_resource_group" "rg" {
  name     = "${local.project}-${local.application_basename}-rg-01"
  location = local.location

  tags = local.tags
}

module "ai_search" {
  source               = "../_modules/ai_search"
  prefix               = local.prefix
  env_short            = local.env_short
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }
  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  tags = local.tags
}

module "function_app" {
  source              = "../_modules/function_app"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  domain              = local.domain
  resource_group_name = azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }
  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  ai_search = {
    id                     = module.ai_search.search_service_id
    url                    = module.ai_search.search_service_url
    service_version        = "2024-03-01-Preview"
    institution_index_name = module.ai_search.search_service_index_aliases.organizations
    services_index_name    = module.ai_search.search_service_index_aliases.services
  }

  tags = local.tags
}


module "cms_function_app" {
  source              = "../_modules/cms_function_app"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  location_short      = local.location_short
  domain              = local.domain
  resource_group_name = azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }
  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  tags = local.tags
}


module "backoffice_app_service" {
  source              = "../_modules/backoffice_app_service"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  location_short      = local.location_short
  domain              = local.domain
  resource_group_name = azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }

  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  cms_fn_default_hostname = module.cms_function_app.cms_fn_default_hostname

  tags = local.tags
}