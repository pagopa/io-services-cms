data "azurerm_private_dns_zone" "privatelink_srch" {
  name                = "privatelink.search.windows.net"
  resource_group_name = "io-p-rg-common"
}