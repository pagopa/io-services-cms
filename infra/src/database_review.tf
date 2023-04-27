# KV secrets flex server
data "azurerm_key_vault_secret" "pgres_flex_admin_login" {
  name         = "pgres-flex-admin-login"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "pgres_flex_admin_pwd" {
  name         = "pgres-flex-admin-pwd"
  key_vault_id = module.key_vault_domain.id
}

# Postgres Flexible Server subnet
module "postgres_flexible_snet" {
  source                                    = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v3.15.0"
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

# DNS private single server
resource "azurerm_private_dns_zone" "privatelink_postgres_database_azure_com" {

  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = data.azurerm_resource_group.vnet_common_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "privatelink_postgres_database_azure_com_vnet" {

  name                  = "${local.project}-${local.application_basename}-pg-flex-link"
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_postgres_database_azure_com.name

  resource_group_name = data.azurerm_resource_group.vnet_common_rg.name
  virtual_network_id  = data.azurerm_virtual_network.vnet_common.id

  registration_enabled = false

  tags = var.tags
}

# https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-compare-single-server-flexible-server
module "postgres_flexible_server_private" {

  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server?ref=v3.15.0"

  name                = "${local.project}-${local.application_basename}-private-pgflex"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ### Network
  private_endpoint_enabled = false
  private_dns_zone_id      = azurerm_private_dns_zone.privatelink_postgres_database_azure_com.id
  delegated_subnet_id      = module.postgres_flexible_snet.id

  ### Admin
  administrator_login    = data.azurerm_key_vault_secret.pgres_flex_admin_login.value
  administrator_password = data.azurerm_key_vault_secret.pgres_flex_admin_pwd.value

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

  custom_metric_alerts = var.pgflex_public_metric_alerts
  alerts_enabled       = true

  diagnostic_settings_enabled = false
  #   log_analytics_workspace_id                = data.azurerm_log_analytics_workspace.log_analytics_workspace.id
  #   diagnostic_setting_destination_storage_id = data.azurerm_storage_account.security_monitoring_storage.id

  depends_on = [azurerm_private_dns_zone_virtual_network_link.privatelink_postgres_database_azure_com_vnet]

}
