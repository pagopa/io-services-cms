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

  subnet_cidr                          = local.app_be.snet_cidr
  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings      = local.app_be.app_settings
  slot_app_settings = local.app_be.app_settings

  tier = "premium"

  application_insights_connection_string = data.azurerm_application_insights.ai_common.connection_string

  tags = var.tags
}

resource "azurerm_role_assignment" "app_be_fn_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn.function_app.function_app.principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn.function_app.function_app.principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.app_be.cosmosdb_name}"
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn.function_app.function_app.slot.principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_staging_slot_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn.function_app.function_app.slot.principal_id
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${local.app_be.cosmosdb_name}"
}

resource "azurerm_role_assignment" "app_be_fn_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn.function_app.function_app.principal_id
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn.function_app.function_app.slot.principal_id
}
