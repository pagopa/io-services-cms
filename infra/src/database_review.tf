# Postgres Flexible Server subnet
module "postgres_flexible_snet" {
  source                                    = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v6.19.1"
  name                                      = "${local.project}-${local.application_basename}-pgres-flexible-snet"
  address_prefixes                          = [var.cidr_subnet_pgres]
  resource_group_name                       = var.vnet_common_rg
  virtual_network_name                      = var.vnet_name
  service_endpoints                         = ["Microsoft.Storage"]
  private_endpoint_network_policies_enabled = true

  delegation = {
    name = "delegation"
    service_delegation = {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-compare-single-server-flexible-server
module "postgres_flexible_server_private" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server?ref=v6.19.1"

  name                = "${local.project}-${local.application_basename}-private-pgflex"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ### Network
  private_endpoint_enabled = true
  private_dns_zone_id      = local.is_prod ? data.azurerm_private_dns_zone.privatelink_postgres_database_azure_com[0].id : null
  delegated_subnet_id      = module.postgres_flexible_snet.id

  ### Admin
  administrator_login    = local.postgres_admin_username
  administrator_password = random_password.postgres_admin_password[var.postgres_admin_credentials_rotation_id].result

  sku_name   = "GP_Standard_D2ds_v5"
  db_version = "13"
  # Possible values are 32768, 65536, 131072, 262144, 524288, 1048576,
  # 2097152, 4194304, 8388608, 16777216, and 33554432.
  storage_mb = 32768

  ### zones & HA
  zone                      = 1
  high_availability_enabled = false
  standby_availability_zone = 3

  maintenance_window_config = {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  ### backup
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  pgbouncer_enabled = true

  custom_metric_alerts = null
  alerts_enabled       = true

  diagnostic_settings_enabled = false

  tags = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "reviewer_database" {
  name      = var.reviewer_db_name
  server_id = module.postgres_flexible_server_private.id
  collation = "en_US.utf8"
  charset   = "utf8"
}
