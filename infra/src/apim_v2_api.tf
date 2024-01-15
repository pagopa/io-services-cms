module "api_services_cms_v2" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//api_management_api?ref=v7.44.0"

  name                = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name
  revision            = "1"
  display_name        = "IO SERVICES CMS API"
  description         = "SERVICES CMS API for IO platform."

  path        = "api/v1/manage"
  protocols   = ["http", "https"]
  product_ids = [data.azurerm_api_management_product.apim_v2_product_services.product_id]

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

resource "azurerm_api_management_api_operation_policy" "create_service_policy_v2" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name
  operation_id        = "createService"

  xml_content = file("./api/io_services_cms/v1/createservice_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "get_service_topics_policy_v2" {
  api_name            = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name
  operation_id        = "getServiceTopics"

  xml_content = file("./api/io_services_cms/v1/getservicetopics_policy/policy.xml")
}

# Named Value fn-services-cms
resource "azurerm_api_management_named_value" "io_fn_services_cms_key_v2" {
  name                = "io-fn-services-cms-key"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name
  display_name        = "io-fn-services-cms-key"
  secret              = "true"

  value_from_key_vault {
    secret_id = data.azurerm_key_vault_secret.function_apim_key.versionless_id
  }
}
