data "azurerm_private_dns_zone" "postgre_dns_zone" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.io_common.resource_group_name
}

resource "azurerm_postgresql_flexible_server" "runtime_server_migration_postgres_flexible_server" {
  name                = "${var.prefix}-${var.env_short}-weu-${local.application_basename}-runtime-server-migration-psql-01"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  version             = 11

  # Network
  public_network_access_enabled = false

  # Credentials
  administrator_login    = data.azurerm_key_vault_secret.subscriptionmigrations_db_server_adm_username.value
  administrator_password = data.azurerm_key_vault_secret.subscriptionmigrations_db_server_adm_password.value

  # Backup
  backup_retention_days        = 7
  geo_redundant_backup_enabled = true
  create_mode                  = "Default"
  zone                         = 3
  auto_grow_enabled            = true

  storage_mb = 32768
  sku_name   = "GP_Standard_D2ds_v5"

  delegated_subnet_id = data.azurerm_subnet.devportal_snet.id
  private_dns_zone_id = data.azurerm_private_dns_zone.postgre_dns_zone.id


  maintenance_window {
    day_of_week  = 3
    start_hour   = 2
    start_minute = 0
  }

  tags = var.tags

  lifecycle {
    # https://registry.terraform.io/providers/hashicorp/azurerm/4.5.0/docs/resources/postgresql_flexible_server#zone-1
    ignore_changes = [zone, high_availability[0].standby_availability_zone]
  }
}

resource "azurerm_private_endpoint" "postgre_pep" {
  name                = "${var.prefix}-${var.env_short}-weu-${local.application_basename}-runtime-server-migration-psql-pep-01"
  location            = azurerm_resource_group.rg.location
  resource_group_name = var.io_common.resource_group_name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet[0].id

  private_service_connection {
    name                           = "${var.prefix}-${var.env_short}-weu-${local.application_basename}-runtime-server-migration-psql-pep-01"
    private_connection_resource_id = azurerm_postgresql_flexible_server.runtime_server_migration_postgres_flexible_server.id
    is_manual_connection           = false
    subresource_names              = ["postgresqlServer"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.postgre_dns_zone.id]
  }

  tags = var.tags
}