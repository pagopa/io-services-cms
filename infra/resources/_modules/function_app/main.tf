locals {
  # Extract the keys (names) and mark them as safe for the loop
  safe_keys = nonsensitive(keys(var.custom_host_keys))
}

##################
#  Function App  #
##################

module "app_be_fn" {
  source  = "pagopa-dx/azure-function-app/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "app-be"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/info"
  node_version        = 20

  subnet_cidr                          = var.app_be_snet_cidr
  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  action_group_id = var.error_action_group_id

  app_settings      = local.app_be.app_settings
  slot_app_settings = local.app_be.app_settings

  tier = local.app_be.tier

  application_insights_connection_string = data.azurerm_application_insights.ai_common.connection_string

  tags = var.tags
}

resource "azapi_resource_action" "custom_host_key" {
  for_each = toset(local.safe_keys)

  # Target the PARENT resource (which we know exists)
  resource_id = module.app_be_fn.function_app.function_app.id
  # Append the key path here, so final URL becomes: .../sites/{name}/host/default/functionKeys/{keyName}
  action = "host/default/functionKeys/${each.key}"
  type   = "Microsoft.Web/sites@2025-03-01"
  method = "PUT"

  body = {
    properties = {
      value = var.custom_host_keys[each.key]
    }
  }
}
