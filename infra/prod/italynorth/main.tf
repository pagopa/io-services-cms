resource "azurerm_resource_group" "rg" {
  name     = "${local.project}-${local.application_basename}-rg-01"
  location = local.location

  tags = local.tags
}

module "networking" {
  source = "../../_modules/networking"

  prefix               = local.prefix
  env_short            = local.env_short
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  vnet_name         = data.azurerm_virtual_network.itn_common.name
  srch_snet_cidrs   = local.srch_snet_cidrs
  app_be_snet_cidrs = local.app_be_snet_cidrs

  tags = local.tags
}

module "ai_search" {
  source               = "../../_modules/ai_search"
  prefix               = local.prefix
  env_short            = local.env_short
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  replica_count   = 1
  partition_count = 1

  snet_id = module.networking.srch_snet_id

  tags = local.tags
}

module "function_app" {
  source               = "../../_modules/function_app"
  prefix               = local.prefix
  env_short            = local.env_short
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  app_be_snet_id = module.networking.app_be_snet_id
  ai_search = {
    id                     = module.ai_search.search_service_id
    url                    = module.ai_search.search_service_url
    institution_index_name = module.ai_search.search_service_index_aliases.organizations
    services_index_name    = module.ai_search.search_service_index_aliases.services
  }

  app_be_fn_settings = {
    FEATURED_ITEMS_CONTAINER_NAME = "static-content"
    FEATURED_ITEMS_FILE_NAME      = "featured-items.json"
  }

  tags = local.tags
}

