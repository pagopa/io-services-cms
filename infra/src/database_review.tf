# Postgres Flexible Server subnet
variable "cidr_subnet_pgres" {
  type        = string
  description = "Subnet address space."
}

module "postgres_flexible_snet" {
  source                                    = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v6.3.0"
  name                                      = "${local.project}-${local.application_basename}-pgres-flexible-snet"
  address_prefixes                          = [var.cidr_subnet_pgres]
  resource_group_name                       = data.azurerm_resource_group.vnet_common_rg.name
  virtual_network_name                      = data.azurerm_virtual_network.vnet_common.name
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

data "azurerm_private_dns_zone" "privatelink_postgres_database_azure_com" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = data.azurerm_resource_group.vnet_common_rg.name
}

# https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-compare-single-server-flexible-server
module "postgres_flexible_server_private" {

  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server?ref=v6.3.0"

  name                = "${local.project}-${local.application_basename}-private-pgflex"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ### Network
  private_endpoint_enabled = false
  private_dns_zone_id      = data.azurerm_private_dns_zone.privatelink_postgres_database_azure_com.id
  delegated_subnet_id      = module.postgres_flexible_snet.id

  ### Admin
  administrator_login    = local.postgres_admin_username
  administrator_password = random_password.postgres_admin_password[var.postgres_admin_credentials_rotation_id].result

  sku_name   = "B_Standard_B1ms"
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

  pgbouncer_enabled = false

  tags = var.tags

  custom_metric_alerts = null
  alerts_enabled       = true

  diagnostic_settings_enabled = false
  #   log_analytics_workspace_id                = data.azurerm_log_analytics_workspace.log_analytics_workspace.id
  #   diagnostic_setting_destination_storage_id = data.azurerm_storage_account.security_monitoring_storage.id

}
