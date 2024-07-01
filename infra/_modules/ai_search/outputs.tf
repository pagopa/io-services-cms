output "search_service_id" {
  value = azurerm_search_service.srch.id
}

output "search_service_url" {
  value = "https://${azurerm_search_service.srch.name}.search.windows.net"
}

output "search_service_index_aliases" {
  value = local.index_aliases
}

