module "pgres_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v4//subnet?ref=v7.20.0"
  name                 = "${var.project}-${var.application_basename}-pgres-snet-01"
  resource_group_name  = var.virtual_network.resource_group_name
  virtual_network_name = var.virtual_network.name
  address_prefixes     = ["10.20.16.0/24"]

  delegation = {
    name = "dlg-Microsoft.DBforPostgreSQL-flexibleServers"
    service_delegation = {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

