output "search_service_id" {
  value = azurerm_search_service.srch.id
}

output "search_service_url" {
  value = "${azurerm_private_endpoint.name}.search.windows.net"
}

output "search_service_index_aliases" {
  value = var.index_aliases
}

