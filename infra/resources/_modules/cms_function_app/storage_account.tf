module "cms_storage_account" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "cms"
    instance_number = "01"
  }
  resource_group_name = var.resource_group_name
  use_case            = "default"
  subnet_pep_id       = var.peps_snet_id

  subservices_enabled = {
    blob  = true
    queue = true
  }

  blob_features = {
    versioning = true
  }

  # queues = values(local.queues)
  queues = flatten([
    for queue in local.queues : (
      lookup(queue, "hasPoison", false) ? [queue.name, "${queue.name}-poison"] : [queue.name]
    )
  ])

  containers = values(local.containers)

  action_group_id = var.error_action_group_id

  tags = var.tags
}
