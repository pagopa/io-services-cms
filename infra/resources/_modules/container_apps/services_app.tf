module "services_ca" {
  /* Cannot use the 4.0 version of the module because the backend_func_itn uses an old azure_container_app
  module with azapi ~>2.7.0 constraint while the new pagopa-dx/azure-container-app/azurerm 5.0 requires the 
  azapi ~>2.9.0. Also we cannot update the backend_func_itn module because its use_case type(function_app) is
  no longer supported on the newest azure_container_app module.
  */
  source  = "pagopa-dx/azure-container-app/azurerm"
  version = "~> 4.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "services"
    instance_number = "01"
  }

  container_app_environment_id = module.svc_container_app_environment_itn.id

  user_assigned_identity_id = module.svc_container_app_environment_itn.user_assigned_identity.id

  container_app_templates = [
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

  resource_group_name = var.resource_group_name

  tags = var.tags
}
