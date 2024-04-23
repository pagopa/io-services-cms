data "azurerm_virtual_network" "itn_common" {
  name                = "${local.project}-common-vnet-001"
  resource_group_name = "${local.project}-common-rg-001"
}