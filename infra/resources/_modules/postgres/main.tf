ephemeral "random_password" "password" {
  length  = 16
  special = true
}

module "cms_postgres_flexible_server" {
  source  = "pagopa-dx/azure-postgres-server/azurerm"
  version = "~> 3.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "cms"
    instance_number = "01"
  }
  resource_group_name                  = var.resource_group_name
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  delegated_subnet_id                  = module.pgres_snet.id

  use_case = "default"

  db_version = "16"
  storage_mb = 32768

  admin_username         = "pgadminusr"
  admin_password         = ephemeral.random_password.password.result
  admin_password_version = 1
  key_vault_id           = var.key_vault_id

  ### backup
  backup_retention_days = 7

  pgbouncer_enabled = true

  custom_metric_alerts = null
  alerts_enabled       = true

  tags = var.tags

  create_replica = false
}
