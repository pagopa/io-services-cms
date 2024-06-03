locals {
  app_be = {
    snet_cidr     = "10.20.5.0/24" # Picked as the first available non-allocated CIDR from the io-p-itn-common-vnet-01
    cosmosdb_name = "app-backend"
    app_settings = {
      NODE_ENV = "production"

      FEATURED_ITEMS_CONTAINER_NAME      = "static-content"
      FEATURED_SERVICES_FILE_NAME        = "featured-services.json"
      FEATURED_INSTITUTIONS_FILE_NAME    = "featured-institutions.json"
      COSMOSDB_NAME                      = "app-backend"
      COSMOSDB_CONTAINER_SERVICE_DETAILS = "services"

      AZURE_SEARCH_ENDPOINT                = var.ai_search.url
      AZURE_SEARCH_SERVICE_VERSION         = var.ai_search.service_version
      AZURE_SEARCH_INSTITUTIONS_INDEX_NAME = var.ai_search.institution_index_name
      AZURE_SEARCH_SERVICES_INDEX_NAME     = var.ai_search.services_index_name
      COSMOSDB_URI                         = data.azurerm_cosmosdb_account.cosmos.endpoint
    }
  }
}

