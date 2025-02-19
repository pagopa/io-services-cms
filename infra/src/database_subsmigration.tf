# https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-compare-single-server-flexible-server
module "subsmigration_postgres_flexible_server" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server?ref=v8.44.2"

  name                = "${local.project}-${local.application_basename}-subsmigration-pgflex"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ### Network
  private_endpoint_enabled = true
  private_dns_zone_id      = local.is_prod ? data.azurerm_private_dns_zone.privatelink_postgres_database_azure_com[0].id : null
  delegated_subnet_id      = module.postgres_flexible_snet.id

  ### Admin
  administrator_login    = data.azurerm_key_vault_secret.devportalservicedata_db_server_adm_username.value
  administrator_password = data.azurerm_key_vault_secret.devportalservicedata_db_server_adm_password.value

  sku_name   = "GP_Standard_D2ds_v5"
  db_version = "11"
  # Possible values are 32768, 65536, 131072, 262144, 524288, 1048576,
  # 2097152, 4194304, 8388608, 16777216, and 33554432.
  storage_mb = 32768

  ### zones & HA
  zone                      = 1
  high_availability_enabled = false

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

# resource "azurerm_postgresql_flexible_server_database" "subsmigration_database" {
#   name      = "db"
#   server_id = module.subsmigration_postgres_flexible_server.id
#   collation = "en_US.utf8"
#   charset   = "utf8"
# }
