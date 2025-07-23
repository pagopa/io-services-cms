output "pgres_cms" {
  value = {
    fqdn = "${module.cms_postgres_flexible_server.postgres.name}.postgres.database.azure.com"
  }
}
