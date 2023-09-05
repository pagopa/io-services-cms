locals {
  backoffice_app_settings = merge({
    AZURE_SUBSCRIPTION_ID = data.azurerm_subscription.current.subscription_id
    # Apim connection
    AZURE_APIM                     = data.azurerm_api_management.apim_v2.name
    AZURE_APIM_RESOURCE_GROUP      = data.azurerm_api_management.apim_v2.resource_group_name
    AZURE_APIM_PRODUCT_NAME        = data.azurerm_api_management_product.apim_product_services.product_id
    APPINSIGHTS_INSTRUMENTATIONKEY = sensitive(data.azurerm_application_insights.application_insights.instrumentation_key)
    },
    {
      for s in var.backoffice_app.app_settings :
      s.name => s.key_vault_secret_name != null ? "@Microsoft.KeyVault(VaultName=${module.key_vault_domain.name};SecretName=${s.key_vault_secret_name})" : s.value
  })
}


module "backoffice_app" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//app_service?ref=v6.20.2"

  name                = format("%s-%s-backoffice-app", local.project, local.application_basename)
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  plan_name = format("%s-%s-backoffice-plan", local.project, local.application_basename)
  sku_name  = var.backoffice_app.sku_name

  docker_image     = format("ghcr.io/pagopa/%s-%s-backoffice", var.prefix, local.application_basename)
  docker_image_tag = "latest"

  health_check_path = "/info"

  app_settings = local.backoffice_app_settings

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    data.azurerm_subnet.appgateway_snet.id,
    data.azurerm_subnet.apim_v2_snet[0].id # FIXME: is it required (apim should not call the app service, but the other way around) ??
  ]

  tags = var.tags
}

resource "azurerm_private_endpoint" "backoffice_app" { # FIXME: is it required (backoffice app service should be called only through appgateway) ?
  name                = format("%s-%s-backoffice-endpoint", local.project, local.application_basename)
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet[0].id

  private_service_connection {
    name                           = format("%s-%s-backoffice-endpoint", local.project, local.application_basename)
    private_connection_resource_id = module.backoffice_app.id
    is_manual_connection           = false
    subresource_names              = ["sites"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azurewebsites_net.id]
  }

  tags = var.tags
}
