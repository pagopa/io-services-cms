module "eventhub" {
  source = "github.com/pagopa/dx//infra/modules/azure_event_hub?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "elt" //TODO: how to name this?
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name

  allowed_sources = local.evhns.allowed_sources

  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  eventhubs = local.evhns.eventhubs

  action_group_id = data.azurerm_monitor_action_group.error_action_group.id
  metric_alerts   = local.evhns.metric_alerts

  tier = local.evhns.tier

  tags = var.tags
}