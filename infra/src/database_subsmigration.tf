module "subsmigration_postgres_flexible_server" {
  source  = "pagopa/dx-azure-postgres-server/azurerm"
  version = "~> 1"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = azurerm_resource_group.rg.location
    app_name        = "${local.application_basename}-subsmigration"
    instance_number = "01"
  }
  resource_group_name                  = azurerm_resource_group.rg.name
  private_dns_zone_resource_group_name = var.io_common.resource_group_name

  tier = "m"

  db_version = 11

  administrator_credentials = {
    name     = data.azurerm_key_vault_secret.subscriptionmigrations_db_server_adm_username.value
    password = data.azurerm_key_vault_secret.subscriptionmigrations_db_server_adm_password.value
  }

  subnet_pep_id = data.azurerm_subnet.private_endpoints_subnet[0].id

  ### backup
  backup_retention_days = 7

  pgbouncer_enabled = true

  custom_metric_alerts = null
  alerts_enabled       = true

  tags = var.tags
}

# resource "azurerm_postgresql_flexible_server_database" "subsmigration_database" {
#   name      = "db"
#   server_id = module.subsmigration_postgres_flexible_server.id
#   collation = "en_US.utf8"
#   charset   = "utf8"
# }
