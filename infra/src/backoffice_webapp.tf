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

  node_version = "18-lts"

  health_check_path = "/api/info"

  app_settings = local.backoffice_app_settings

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    data.azurerm_subnet.appgateway_snet.id,
  ]

  tags = var.tags
}
