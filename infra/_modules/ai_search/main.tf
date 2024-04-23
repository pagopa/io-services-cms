#####################
#  Azure AI Search  #
#####################

resource "azurerm_search_service" "srch" {
  name                          = "${var.project}-${var.application_basename}-srch-001"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  public_network_access_enabled = var.public_network_access_enabled
  local_authentication_enabled  = false

  sku             = "basic"
  replica_count   = var.replica_count
  partition_count = var.partition_count

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "srch" {
  depends_on          = [azurerm_search_service.srch]
  name                = "${var.project}-${var.application_basename}-pep-001"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = data.azurerm_subnet.pep_snet.id

  private_service_connection {
    name                           = azurerm_search_service.srch.name
    private_connection_resource_id = azurerm_search_service.srch.id
    is_manual_connection           = false
    subresource_names              = ["searchService"]
  }

  private_dns_zone_group {
    name                 = "${var.project}-${var.application_basename}-dns-zone-group-001"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_srch.id]
  }

  tags = var.tags
}

resource "azurerm_role_assignment" "search_to_cosmos_account_reader" {
  scope                = data.azurerm_cosmosdb_account.cosmos.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = azurerm_search_service.srch.identity[0].principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "search_to_cosmos_data_reader" {
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
  account_name        = data.azurerm_cosmosdb_account.cosmos.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
  principal_id        = azurerm_search_service.srch.identity[0].principal_id
  scope               = data.azurerm_cosmosdb_account.cosmos.id
}
