output "search_service_id" {
  value = azurerm_search_service.srch.id
}

output "search_service_url" {
  value = azurerm_private_endpoint.srch.private_dns_zone_configs[0].record_sets[0].fqdn
}

output "search_service_index_aliases" {
  value = var.index_aliases
}

