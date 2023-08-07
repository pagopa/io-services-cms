module "api_services_cms" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//api_management_api?ref=v6.20.0"

  name                = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  revision            = "1"
  display_name        = "IO SERVICES CMS API"
  description         = "SERVICES CMS API for IO platform."

  path        = "api/v1/manage"
  protocols   = ["http", "https"]
  product_ids = [data.azurerm_api_management_product.apim_product_services.product_id]

  service_url = "https://${module.webapp_functions_app.default_hostname}/api/v1"

  subscription_required = true

  content_format = "openapi"
  content_value = templatefile("./api/io_services_cms/v1/_swagger.yaml.tpl",
    {
      host     = "api.io.pagopa.it",
      basePath = "api/v1/manage"
    }
  )

  xml_content = file("./api/io_services_cms/v1/policy.xml")
}


# API operation policy

resource "azurerm_api_management_api_operation_policy" "create_service_policy" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  operation_id        = "createService"

  xml_content = file("./api/io_services_cms/v1/createservice_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "update_service_logo_policy" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  operation_id        = "updateServiceLogo"

  xml_content = file("./api/io_services_cms/v1/updateservicelogo_policy/policy.xml")
}

# Temporary policy resource for the time needed to upgrade apim to v2
resource "azurerm_api_management_api_operation_policy" "delete_service_policy" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  operation_id        = "deleteService"

  xml_content = file("./api/io_services_cms/v1/temp_mock_response_500_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "update_service_policy" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  operation_id        = "updateService"

  xml_content = file("./api/io_services_cms/v1/temp_mock_response_500_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "regenerate_service_key_policy" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  operation_id        = "regenerateServiceKey"

  xml_content = file("./api/io_services_cms/v1/temp_mock_response_500_policy/policy.xml")
}

# Named Value fn-services-cms
resource "azurerm_api_management_named_value" "io_fn_services_cms_key" {
  name                = "io-fn-services-cms-key"
  api_management_name = data.azurerm_api_management.apim.name
  resource_group_name = data.azurerm_api_management.apim.resource_group_name
  display_name        = "io-fn-services-cms-key"
  value               = azurerm_key_vault_secret.webapp_fn_app_key.value
  secret              = "true"
}
