# Database instance
module "cosmosdb_account" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_account?ref=v8.5.0"

  name                = "${local.project}-cosmos-${local.application_basename}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  enable_free_tier    = false
  kind                = "GlobalDocumentDB"

  domain = "${local.project}-${local.application_basename}"

  public_network_access_enabled       = var.cosmos_public_network_access_enabled
  private_endpoint_enabled            = var.cosmos_private_endpoint_enabled
  private_dns_zone_sql_ids            = local.is_prod ? [data.azurerm_private_dns_zone.privatelink_documents_azure_com[0].id] : []
  private_endpoint_sql_name           = "${local.project}-cosmos-${local.application_basename}"
  private_service_connection_sql_name = "${local.project}-cosmos-services-cms-private-endpoint"
  subnet_id                           = local.is_prod ? data.azurerm_subnet.private_endpoints_subnet[0].id : null
  is_virtual_network_filter_enabled   = false

  main_geo_location_location       = azurerm_resource_group.rg.location
  main_geo_location_zone_redundant = true
  enable_automatic_failover        = true

  additional_geo_locations = [{
    location          = "northeurope"
    failover_priority = 1
    zone_redundant    = false
  }]

  consistency_policy = {
    consistency_level       = "Session"
    max_interval_in_seconds = null
    max_staleness_prefix    = null
  }

  tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "db_cms" {
  name                = "db-services-cms"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = module.cosmosdb_account.name
}

resource "azurerm_cosmosdb_sql_database" "db_app_be" {
  name                = "app-backend"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = module.cosmosdb_account.name
}

### Containers
locals {
  db_cms_containers = [
    {
      name               = local.cosmos_containers.services_lifecycle
      partition_key_path = "/id"
      max_throughput     = 1000
    },
    {
      name               = local.cosmos_containers.services_publication
      partition_key_path = "/id"
      max_throughput     = 1000
    },
    {
      name               = local.cosmos_containers.services_history
      partition_key_path = "/serviceId"
      max_throughput     = 1000
    },
  ]
  db_app_be_containers = [
    {
      name               = "services"
      partition_key_path = "/id"
      max_throughput     = 1000
    },
  ]
}

module "db_cms_containers" {
  source   = "github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_sql_container?ref=v8.5.0"
  for_each = { for c in local.db_cms_containers : c.name => c }

  name                = each.value.name
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = module.cosmosdb_account.name
  database_name       = azurerm_cosmosdb_sql_database.db_cms.name
  partition_key_path  = each.value.partition_key_path
  autoscale_settings  = { max_throughput = each.value.max_throughput }
}

module "db_app_be_containers" {
  source   = "github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_sql_container?ref=v8.5.0"
  for_each = { for c in local.db_app_be_containers : c.name => c }

  name                = each.value.name
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = module.cosmosdb_account.name
  database_name       = azurerm_cosmosdb_sql_database.db_app_be.name
  partition_key_path  = each.value.partition_key_path
  autoscale_settings  = { max_throughput = each.value.max_throughput }
}
