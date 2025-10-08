module "backend_func_itn" {
  source = "github.com/pagopa/dx//infra/modules/azure_container_app?ref=CES-1339-modificare-il-modulo-terraform-per-azure-function-per-supportare-container-app"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "app-be"
    instance_number = "02"
  }

  resource_group_name          = var.resource_group_name
  container_app_environment_id = module.svc_container_app_environment_itn.id
  user_assigned_identity_id    = module.svc_container_app_environment_itn.user_assigned_identity.id
  target_port                  = 80

  function_settings = {
    key_vault_name                         = var.key_vault.name
    subnet_pep_id                          = var.peps_snet_id
    private_dns_zone_resource_group_id     = var.private_dns_zone_resource_group_id
    application_insights_connection_string = var.appi_connection_string
  }

  container_app_templates = [
    {
      image = "mcr.microsoft.com/azure-functions/dotnet8-quickstart-demo:1.0"
      name  = "quickstart"

      app_settings = {
        key1 = "value1"
      }

      liveness_probe = {
        path = "/"
      }
      # readiness_probe = {
      #   path = "/"
      # }
    },
  ]

  tags = var.tags
}
