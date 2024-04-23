terraform {
  required_providers {
    restapi = {
      source = "Mastercard/restapi"
      version = "<= 1.19.1"
    }
  }
}

provider "restapi" {
  uri                  = "https://${azurerm_search_service.srch.name}.search.windows.net"
  write_returns_object = true
  debug                = true

  headers = {
    "api-key"      = azurerm_search_service.srch.primary_key,
    "Content-Type" = "application/json"
  }

  create_method  = "POST"
  update_method  = "PUT"
  destroy_method = "DELETE"
}
