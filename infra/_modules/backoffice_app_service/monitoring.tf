module "backoffice_app_service_autoscaler" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service_plan_autoscaler?ref=main"

  resource_group_name = var.resource_group_name
  target_service = {
    app_service_name = module.backoffice_app_service.app_service.app_service.name
  }

  scheduler = {
    normal_load = {
      default = local.backoffice.autoscale_settings.default
      minimum = local.backoffice.autoscale_settings.min
    }
    maximum = local.backoffice.autoscale_settings.max
  }

  scale_metrics = {
    requests = {
      upper_threshold = 3000
      lower_threshold = 2000
      increase_by     = 2
      decrease_by     = 1
    },
    cpu = {
      upper_threshold = 60
      lower_threshold = 30
      increase_by     = 2
      decrease_by     = 1
    },
    memory = {
      upper_threshold = 80
      lower_threshold = 30
      increase_by     = 2
      decrease_by     = 1
    }
  }

  tags = var.tags
}