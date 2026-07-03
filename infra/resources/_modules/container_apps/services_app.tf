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
        HOST     = "0.0.0.0"
        NODE_ENV = "production"
        PORT     = 3000
      }

      liveness_probe = {
        path = "/api/info"
      }
    },
  ]

  autoscaler = {}

  container_port = 3000

  resource_group_name = var.resource_group_name

  tags = var.tags
}
