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

module "key_vault" {
  source              = "../_modules/key_vault"
  prefix              = local.prefix
  env_short           = local.env_short
  location_short      = local.location_short
  domain              = local.domain
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name

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
  app_be_snet_cidr                     = local.app_be_snet_cidr
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
  ai_common_instrumentation_key        = data.azurerm_application_insights.ai_common.instrumentation_key
  cms_snet_cidr                        = local.cms_snet_cidr
  bo_snet_cidr                         = local.bo_snet_cidr

  tags = local.tags
}


module "backoffice" {
  source              = "../_modules/backoffice"
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
  bo_snet_cidr                         = local.bo_snet_cidr
  # Cms Fn Binding
  cms_fn_default_hostname = module.cms_function_app.cms_fn_default_hostname

  # KeyVault Secrets
  key_vault_id                                  = module.key_vault.key_vault_id
  bo_auth_session_secret_name                   = module.key_vault.secrets_name.bo_auth_session_secret
  azure_client_secret_credential_client_id_name = module.key_vault.secrets_name.azure_client_secret_credential_client_id
  azure_client_secret_credential_secret_name    = module.key_vault.secrets_name.azure_client_secret_credential_secret
  legacy_cosmosdb_key_name                      = module.key_vault.secrets_name.legacy_cosmosdb_key
  selfcare_api_key_name                         = module.key_vault.secrets_name.selfcare_api_key
  subscription_migration_api_key_name           = module.key_vault.secrets_name.subscription_migration_api_key

  tags = local.tags
}