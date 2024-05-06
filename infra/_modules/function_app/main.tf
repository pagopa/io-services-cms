##################
#  Function App  #
##################

module "app_be_fn" {
  source              = "github.com/pagopa/terraform-azurerm-v3//function_app?ref=v8.9.0"
  name                = "${var.project}-${var.application_basename}-app-be-fn-01"
  resource_group_name = var.resource_group_name
  location            = var.location
  health_check_path   = "/api/v1/info"

  export_keys = true # needed

  app_service_plan_info = {
    kind                         = "Linux"
    sku_tier                     = var.fn_sku_tier
    sku_size                     = var.fn_sku_size
    zone_balancing_enabled       = var.fn_zone_balancing_enabled
    worker_count                 = null
    maximum_elastic_worker_count = null
  }

  storage_account_info = {
    account_kind                      = "StorageV2"
    account_tier                      = "Standard"
    account_replication_type          = "ZRS"
    access_tier                       = "Hot"
    advanced_threat_protection_enable = false
    use_legacy_defender_version       = false
    public_network_access_enabled     = false
  }

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = merge(
    var.app_be_fn_settings,
    {
      AZURE_SEARCH_ENDPOINT                = var.ai_search.url
      AZURE_SEARCH_SERVICE_VERSION         = var.ai_search.service_version
      AZURE_SEARCH_INSTITUTIONS_INDEX_NAME = var.ai_search.institution_index_name
      AZURE_SEARCH_SERVICES_INDEX_NAME     = var.ai_search.services_index_name
      COSMOSDB_URI                         = data.azurerm_cosmosdb_account.cosmos.endpoint
      COSMOSDB_NAME                        = var.cosmos_database_name
      COSMOSDB_CONTAINER_SERVICE_DETAILS   = var.cosmos_container_name
    }
  )

  sticky_app_setting_names = [
    "APPINSIGHTS_INSTRUMENTATIONKEY"
  ]

  subnet_id = var.app_be_snet_id

  allowed_subnets = [
    data.azurerm_subnet.appbackendl1_snet.id,
    data.azurerm_subnet.appbackendl2_snet.id,
    data.azurerm_subnet.appbackendli_snet.id
  ]

  application_insights_instrumentation_key = data.azurerm_application_insights.ai_common.instrumentation_key

  system_identity_enabled = true

  tags = var.tags
}

module "app_be_fn_staging_slot" {
  source              = "github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v8.5.0"
  name                = "staging"
  resource_group_name = var.resource_group_name
  location            = var.location
  health_check_path   = "/api/v1/info"

  function_app_id = module.app_be_fn.id

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = merge(
    var.app_be_fn_settings,
    {
      AZURE_SEARCH_ENDPOINT                = var.ai_search.url
      AZURE_SEARCH_INSTITUTIONS_INDEX_NAME = var.ai_search.institution_index_name
      AZURE_SEARCH_SERVICES_INDEX_NAME     = var.ai_search.services_index_name
      COSMOSDB_URI                         = data.azurerm_cosmosdb_account.cosmos.endpoint
      COSMOSDB_NAME                        = var.cosmos_database_name
      COSMOSDB_CONTAINER_SERVICE_DETAILS   = var.cosmos_container_name
    }
  )

  storage_account_name       = module.app_be_fn.storage_account.name
  storage_account_access_key = module.app_be_fn.storage_account.primary_access_key

  subnet_id = var.app_be_snet_id

  allowed_subnets = [
    data.azurerm_subnet.github_runner_subnet.id
  ]

  application_insights_instrumentation_key = data.azurerm_application_insights.ai_common.instrumentation_key #FIXME: is it required?!

  system_identity_enabled = true

  tags = var.tags
}

resource "azurerm_role_assignment" "app_be_fn_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn.system_identity_principal
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn.system_identity_principal
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${var.cosmos_database_name}"
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.app_be_fn_staging_slot.system_identity_principal
}

resource "azurerm_cosmosdb_sql_role_assignment" "app_be_fn_staging_slot_to_cosmos_data_reader_db" {
  resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = module.app_be_fn_staging_slot.system_identity_principal
  scope               = "${data.azurerm_cosmosdb_account.cosmos.id}/dbs/${var.cosmos_database_name}"
}

resource "azurerm_role_assignment" "app_be_fn_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn.system_identity_principal
}

resource "azurerm_role_assignment" "app_be_fn_staging_slot_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.app_be_fn_staging_slot.system_identity_principal
}
