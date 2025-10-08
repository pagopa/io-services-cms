
module "key_vault" {
  source              = "../_modules/key_vault"
  prefix              = local.prefix
  env_short           = local.env_short
  location_short      = local.location_short
  domain              = local.domain
  location            = local.location
  resource_group_name = data.azurerm_resource_group.rg.name

  tags = local.tags
}

module "monitor" {
  source              = "../_modules/monitor"
  prefix              = local.prefix
  env_short           = local.env_short
  location_short      = local.location_short
  domain              = local.domain
  location            = local.location
  resource_group_name = data.azurerm_resource_group.rg.name
  key_vault = {
    id = module.key_vault.key_vault_id
    secrets_name = {
      slack_svc_monitor_email = module.key_vault.secrets_name.slack_svc_monitor_email
      opsgenie_svc_api_key    = module.key_vault.secrets_name.opsgenie_svc_api_key
    }
  }

  tags = local.tags
}

module "ai_search" {
  source               = "../_modules/ai_search"
  prefix               = local.prefix
  env_short            = local.env_short
  project              = local.project
  location             = local.location
  application_basename = local.application_basename
  resource_group_name  = data.azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }
  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  error_action_group_id = module.monitor.action_group_ids.offcall

  tags = local.tags
}

module "function_app" {
  source              = "../_modules/function_app"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  domain              = local.domain
  resource_group_name = data.azurerm_resource_group.rg.name

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

  error_action_group_id = module.monitor.action_group_ids.oncall

  tags = local.tags
}

module "cms_function_app" {
  source              = "../_modules/cms_function_app"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  location_short      = local.location_short
  domain              = local.domain
  resource_group_name = data.azurerm_resource_group.rg.name

  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }
  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name
  ai_common_connection_string          = data.azurerm_application_insights.ai_common.connection_string
  cms_snet_cidr                        = local.cms_snet_cidr
  bo_snet_cidr                         = local.bo_snet_cidr

  # KeyVault Secrets
  key_vault_id                                          = module.key_vault.key_vault_id
  cms_pgres_reviewer_usr_pwd                            = module.key_vault.secrets_value.cms_pgres_reviewer_usr_pwd
  jira_token_name                                       = module.key_vault.secrets_name.jira_token
  azure_client_secret_credential_secret_name            = module.key_vault.secrets_name.azure_client_secret_credential_secret
  azure_client_secret_credential_client_id_name         = module.key_vault.secrets_name.azure_client_secret_credential_client_id
  serviceid_quality_check_exclusion_list_name           = module.key_vault.secrets_name.serviceid_quality_check_exclusion_list
  legacy_cosmosdb_connectionstring_name                 = module.key_vault.secrets_name.legacy_cosmosdb_connectionstring
  legacy_cosmosdb_key_name                              = module.key_vault.secrets_name.legacy_cosmosdb_key
  asset_storage_connectionstring_secret_name            = module.key_vault.secrets_name.asset_storage_connectionstring_secret
  services_publication_event_hub_connection_string_name = module.key_vault.secrets_name.services_publication_event_hub_connection_string
  services_topics_event_hub_connection_string_name      = module.key_vault.secrets_name.services_topics_event_hub_connection_string
  services_lifecycle_event_hub_connection_string_name   = module.key_vault.secrets_name.services_lifecycle_event_hub_connection_string
  services_history_event_hub_connection_string_name     = module.key_vault.secrets_name.services_history_event_hub_connection_string
  activations_event_hub_connection_string_name          = module.key_vault.secrets_name.activations_event_hub_connection_string
  eh_sc_connectionstring_name                           = module.key_vault.secrets_name.eh_sc_connectionstring
  pdv_tokenizer_api_key_name                            = module.key_vault.secrets_name.pdv_tokenizer_api_key

  error_action_group_id = module.monitor.action_group_ids.oncall

  pgres_cms_fqdn = module.postgres.pgres_cms.fqdn

  tags = local.tags
}

module "backoffice" {
  source              = "../_modules/backoffice"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  domain              = local.domain
  resource_group_name = data.azurerm_resource_group.rg.name

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
  bo_auth_session_secret                        = module.key_vault.secrets_value.bo_auth_session_secret
  azure_client_secret_credential_client_id_name = module.key_vault.secrets_name.azure_client_secret_credential_client_id
  azure_client_secret_credential_secret_name    = module.key_vault.secrets_name.azure_client_secret_credential_secret
  legacy_cosmosdb_key_name                      = module.key_vault.secrets_name.legacy_cosmosdb_key
  selfcare_api_key_name                         = module.key_vault.secrets_name.selfcare_api_key
  subscription_migration_api_key_name           = module.key_vault.secrets_name.subscription_migration_api_key

  tags = local.tags
}

module "eventhub" {
  source              = "../_modules/eventhub"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  domain              = local.domain
  resource_group_name = data.azurerm_resource_group.rg.name

  # Cms Fn Binding
  cms_fn_name         = module.cms_function_app.cms_fn_name
  cms_fn_principal_id = module.cms_function_app.cms_fn_principal_id

  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.evt-rg.name

  error_action_group_id = module.monitor.action_group_ids.offcall

  tags = local.tags
}

module "postgres" {
  source               = "../_modules/postgres"
  prefix               = local.prefix
  env_short            = local.env_short
  location_short       = local.location_short
  location             = local.location
  project              = local.project
  domain               = local.domain
  application_basename = local.application_basename
  resource_group_name  = data.azurerm_resource_group.rg.name

  # Cms Fn Binding
  cms_fn_name         = module.cms_function_app.cms_fn_name
  cms_fn_principal_id = module.cms_function_app.cms_fn_principal_id

  cms_pgres_admin_pwd = module.key_vault.secrets_value.cms_pgres_admin_pwd

  virtual_network = {
    id                  = data.azurerm_virtual_network.itn_common.id
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }

  peps_snet_id                         = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  tags = local.tags
}

resource "dx_available_subnet_cidr" "next_cidr_cae" {
  virtual_network_id = data.azurerm_virtual_network.itn_common.id
  prefix_length      = 23
}

module "container_apps" {
  source              = "../_modules/container_apps"
  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  domain              = local.domain
  resource_group_name = data.azurerm_resource_group.rg.name

  log_analytics_workspace_id = data.azurerm_log_analytics_workspace.common.id

  subnet_cidr                        = dx_available_subnet_cidr.next_cidr_cae.cidr_block
  peps_snet_id                       = data.azurerm_subnet.private_endpoints_subnet.id
  private_dns_zone_resource_group_id = data.azurerm_resource_group.weu-common.id
  virtual_network = {
    name                = data.azurerm_virtual_network.itn_common.name
    resource_group_name = data.azurerm_virtual_network.itn_common.resource_group_name
  }

  key_vault = {
    name = module.key_vault.name
  }

  appi_connection_string = data.azurerm_application_insights.ai_common.connection_string

  tags = local.tags
}
