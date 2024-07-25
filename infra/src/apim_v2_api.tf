data "azurerm_linux_function_app" "itn_webapp_functions_app" {
  name                = "${local.project}-itn-svc-app-be-func-01"
  resource_group_name = "${local.project}-itn-svc-rg-01"
}

module "api_services_cms_v2" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//api_management_api?ref=v7.45.0"

  name                = "io-services-cms-api"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name
  revision            = "1"
  display_name        = "IO SERVICES CMS API"
  description         = "SERVICES CMS API for IO platform."

  path        = "api/v1/manage"
  protocols   = ["http", "https"]
  product_ids = [data.azurerm_api_management_product.apim_v2_product_services.product_id]

  service_url = "https://${data.azurerm_linux_function_app.itn_webapp_functions_app.default_hostname}/api/v1"

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
resource "azurerm_api_management_logger" "cache_policy_app_insights" {
  name                = "cache-policy-appinsight-apimlogger"
  api_management_name = data.azurerm_api_management.apim_v2.name
  resource_group_name = data.azurerm_api_management.apim_v2.resource_group_name

  application_insights {
    instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key
  }
}

resource "azurerm_api_management_api_diagnostic" "services_cms_api_app_insights" {
  identifier               = "applicationinsights"
  resource_group_name      = data.azurerm_api_management.apim_v2.resource_group_name
  api_management_name      = data.azurerm_api_management.apim_v2.name
  api_name                 = module.api_services_cms_v2.name
  api_management_logger_id = azurerm_api_management_logger.cache_policy_app_insights.id

  sampling_percentage       = 100.0
  always_log_errors         = true
  log_client_ip             = false
  verbosity                 = "verbose"
  http_correlation_protocol = "W3C"

  frontend_response {
    body_bytes = 32
  }

  backend_response {
    body_bytes = 32
  }
}
