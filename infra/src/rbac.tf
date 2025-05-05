data "azurerm_data_factory" "adf" {
  name                = "io-p-data-factory"
  resource_group_name = "io-p-rg-operations"
}

module "adf_to_cosmos_data_reader_db" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.0"

  principal_id    = data.azurerm_data_factory.adf.identity[0].principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id
  cosmos = [{
    account_name        = module.cosmosdb_account.name
    resource_group_name = azurerm_resource_group.rg.name
    description         = "To allow ADF Interactive authoring"
    role                = "reader"
    database            = azurerm_cosmosdb_sql_database.db_cms.name
    }, {
    account_name        = module.cosmosdb_account.name
    resource_group_name = azurerm_resource_group.rg.name
    description         = "To allow export of published services"
    role                = "reader"
    database            = azurerm_cosmosdb_sql_database.db_cms.name
    collections         = ["services-publication"]
    }
  ]
}
