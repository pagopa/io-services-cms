#######
# API #
#######

resource "azurerm_api_management_api" "api_services_cms" {
  name                = "io-services-cms-api"
  resource_group_name = var.api_management.resource_group_name
  api_management_name = var.api_management.name
  revision            = "1"
  display_name        = "IO Services CMS"
  path                = "api/v1/manage"
  protocols           = ["https"]
  service_url         = "https://${var.cms_hostname}/api/v1"

  import {
    content_format = "openapi"
    content_value = templatefile("${path.module}/api/io_services_cms/v1/_swagger.yaml.tpl",
      {
        host     = "api.io.pagopa.it",
        basePath = "api/v1/manage"
      }
    )
  }

}


###############
# API Product #
###############

resource "azurerm_api_management_product_api" "this" {
  product_id          = var.api_management.product_id
  api_name            = azurerm_api_management_api.api_services_cms.name
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name
}

##########
# Policy #
##########

resource "azurerm_api_management_api_policy" "this" {
  api_name            = azurerm_api_management_api.api_services_cms.name
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name

  xml_content = file("${path.module}/api/io_services_cms/v1/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "create_service" {
  api_name            = "io-services-cms-api"
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name
  operation_id        = "createService"

  xml_content = file("${path.module}/api/io_services_cms/v1/createservice_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "update_service" {
  api_name            = "io-services-cms-api"
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name
  operation_id        = "updateService"

  xml_content = file("${path.module}/api/io_services_cms/v1/updateService_policy/policy.xml")
}

resource "azurerm_api_management_api_operation_policy" "get_service_topics" {
  api_name            = "io-services-cms-api"
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name
  operation_id        = "getServiceTopics"

  xml_content = file("${path.module}/api/io_services_cms/v1/getservicetopics_policy/policy.xml")
}


resource "azurerm_api_management_logger" "cache_policy_app_insights" {
  name                = "cache-policy-appinsight-apimlogger"
  api_management_name = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_cms.resource_group_name

  application_insights {
    instrumentation_key = var.ai_instrumentation_key
  }
}


##############
# Diagnostic #
##############

resource "azurerm_api_management_api_diagnostic" "services_cms_api_app_insights" {
  identifier               = "applicationinsights"
  api_management_name      = azurerm_api_management_api.api_services_cms.api_management_name
  resource_group_name      = azurerm_api_management_api.api_services_cms.resource_group_name
  api_name                 = azurerm_api_management_api.api_services_cms.name
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
