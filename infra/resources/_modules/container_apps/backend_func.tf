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
  revision_mode                = "Single"
  use_case                     = "function_app"

  function_settings = {
    key_vault_name                         = var.key_vault.name
    subnet_pep_id                          = var.peps_snet_id
    private_dns_zone_resource_group_id     = var.private_dns_zone_resource_group_id
    application_insights_connection_string = var.appi_connection_string
  }

  autoscaler = {
    replicas = {
      minimum = 50
      maximum = 200
    }
    http_scalers = [
      {
        name                = "http-scale-rule"
        concurrent_requests = 40
      }
    ]
    custom_scalers = [
      {
        name             = "cpu-scale-rule"
        custom_rule_type = "cpu"
        metadata = {
          type  = "Utilization"
          value = "70"
        }
      },
      {
        name             = "memory-scale-rule"
        custom_rule_type = "memory"
        metadata = {
          type  = "Utilization"
          value = "80"
        }
      }
    ]
  }

  container_app_templates = [
    {
      image = "ghcr.io/pagopa/io-services-app-backend:latest"
      name  = "appbackend"

      app_settings = local.app_be.app_settings

      liveness_probe = {
        transport = "TCP"
      }
      readiness_probe = {
        path = "/api/v1/info"
      }
    }
  ]

  tags = var.tags
}
