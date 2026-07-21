module "services_ca" {
  source  = "pagopa-dx/azure-container-app/azurerm"
  version = "~> 5.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "services"
    instance_number = "01"
  }

  container_app_environment_id = module.svc_container_app_environment_itn.id

  log_analytics_workspace_id = var.log_analytics_workspace_id

  containers = [
    {
      image = "ghcr.io/pagopa/io-services-app"
      name  = "io-services"

      app_settings = {
        CMS_COSMOSDB_CONTAINER_SERVICES_LIFECYCLE   = "services-lifecycle"
        CMS_COSMOSDB_CONTAINER_SERVICES_PUBLICATION = "services-publication"
        CMS_COSMOSDB_ENDPOINT                       = data.azurerm_cosmosdb_account.cosmos.endpoint
        CMS_COSMOSDB_NAME                           = "db-services-cms"
        HOST                                        = "0.0.0.0"
        NODE_ENV                                    = "production"
        PORT                                        = 3000
        POSTGRES_DATABASE                           = var.services_postgres.database
        POSTGRES_HOST                               = var.services_postgres.host
        POSTGRES_PORT                               = var.services_postgres.port
        POSTGRES_USER                               = var.services_postgres.user
        TOPIC_SCHEMA                                = var.services_postgres.topic.schema
        TOPIC_TABLE                                 = var.services_postgres.topic.table
      }

      secret_names = ["POSTGRES_PASSWORD"]

      liveness_probe = {
        path = "/api/info"
      }
    },
  ]

  container_port = 3000
  autoscaler = {
    replicas = {
      minimum = 0
      maximum = 8
    }
  }

  resource_group_name = var.resource_group_name

  secrets = [{
    name                = "POSTGRES_PASSWORD"
    key_vault_secret_id = "https://${var.cms_key_vault.name}.vault.azure.net/secrets/${var.services_postgres.password_secret_name}"
  }]

  tags = var.tags
}
