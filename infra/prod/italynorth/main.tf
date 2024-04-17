resource "azurerm_resource_group" "rg" {
  name     = "${local.project}-${local.application_basename}-rg-001"
  location = local.location

  tags = local.tags
}

module "networking" {
  source = "../../_modules/networking"

  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  vnet_name  = data.azurerm_virtual_network.itn_common.name
  snet_cidrs = local.srch_snet_cidrs

  tags = local.tags
}

module "ai_search" {
  source               = "../../_modules/ai_search"
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = azurerm_resource_group.rg.name

  sku             = "basic"
  replica_count   = 1
  partition_count = 1

  snet_id = module.networking.snet_id

  tags = local.tags
}

