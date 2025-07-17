module "cms_postgres_flexible_server" {
  source  = "pagopa/dx-azure-postgres-server/azurerm"
  version = "~> 1"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "cms-psql"
    instance_number = "01"
  }
  resource_group_name                  = var.resource_group_name
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  tier = "m"

  db_version = "16"
  storage_mb = 32768
  zone       = 1

  administrator_credentials = {
    name     = local.postgres_admin_username
    password = random_password.postgres_admin_password[var.postgres_admin_credentials_rotation_id].result
  }

  subnet_pep_id = var.peps_snet_id

  ### backup
  backup_retention_days = 7

  pgbouncer_enabled = true

  custom_metric_alerts = null
  alerts_enabled       = true

  tags = var.tags
}
