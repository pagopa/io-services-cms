locals {
  private_dns_zone_resource_group_name = provider::azurerm::parse_resource_id(var.private_dns_zone_resource_group_id)["resource_name"]
  subscription_id                      = provider::azurerm::parse_resource_id(var.private_dns_zone_resource_group_id)["subscription_id"]
}
