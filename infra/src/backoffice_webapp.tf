locals {
  backoffice_node_version      = "18-lts"
  backoffice_health_check_path = "/api/info"
  backoffice_app_settings = merge({
    NODE_ENV = "production"
    # Apim connection
    AZURE_SUBSCRIPTION_ID     = data.azurerm_subscription.current.subscription_id
    AZURE_APIM                = data.azurerm_api_management.apim_v2.name
    AZURE_APIM_RESOURCE_GROUP = data.azurerm_api_management.apim_v2.resource_group_name
    AZURE_APIM_PRODUCT_NAME   = data.azurerm_api_management_product.apim_v2_product_services.product_id
    # Logs
    APPINSIGHTS_INSTRUMENTATIONKEY = sensitive(data.azurerm_application_insights.application_insights.instrumentation_key)
    # NextAuthJS
    NEXTAUTH_URL    = "https://selfcare.io.pagopa.it/" # FIXME: move into terraform.tfvars or use a terraform resource/data ref
    NEXTAUTH_SECRET = azurerm_key_vault_secret.bo_auth_session_secret.value
  })
}


module "backoffice_app" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//app_service?ref=v6.20.2"

  name                = format("%s-%s-backoffice-app", local.project, local.application_basename)
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  plan_name = format("%s-%s-backoffice-plan", local.project, local.application_basename)
  sku_name  = var.backoffice_app.sku_name

  node_version = local.backoffice_node_version

  health_check_path = local.backoffice_health_check_path

  app_settings = local.backoffice_app_settings

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    module.backoffice_app_snet.id,
    data.azurerm_subnet.appgateway_snet.id,
  ]

  tags = var.tags
}

module "backoffice_app_staging" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//app_service_slot?ref=v6.20.2"

  name                = "staging"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  app_service_id   = module.backoffice_app.id
  app_service_name = module.backoffice_app.name

  node_version = local.backoffice_node_version

  health_check_path = local.backoffice_health_check_path

  app_settings = local.backoffice_app_settings

  always_on        = true
  vnet_integration = true

  subnet_id = module.backoffice_app_snet.id

  allowed_subnets = [
    module.backoffice_app_snet.id,
    local.is_prod ? data.azurerm_subnet.github_runner_subnet[0].id : null
  ]

  tags = var.tags
}
