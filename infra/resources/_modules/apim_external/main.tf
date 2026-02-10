################
# Version Sets #
################
resource "azurerm_api_management_api_version_set" "io_services_app_backend_v1" {
  name                = "io_services_app_backend_v1"
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name
  display_name        = "IO Services App Backend v1"
  versioning_scheme   = "Segment"
}


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

resource "azurerm_api_management_api" "api_services_app_backend" {
  name                  = "io-services-app-backend-api"
  api_management_name   = var.api_management.name
  resource_group_name   = var.api_management.resource_group_name
  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.io_services_app_backend_v1.id
  version        = "v1"
  revision       = "1"

  description  = "IO Services App Backend API"
  display_name = "IO Services App Backend"
  path         = "api/catalog"
  protocols    = ["https"]

  import {
    content_format = "openapi"
    content_value = templatefile("${path.module}/api/app_backend/v1/_swagger.yaml.tpl",
      {
        host     = "api.io.pagopa.it",
        basePath = "api/catalog"
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

resource "azurerm_api_management_product_api" "app_backend" {
  product_id          = var.api_management.product_id
  api_name            = azurerm_api_management_api.api_services_app_backend.name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
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

resource "azurerm_api_management_api_policy" "app_backend" {
  api_name            = azurerm_api_management_api.api_services_app_backend.name
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name

  xml_content = file("${path.module}/api/app_backend/v1/policy.xml")

  depends_on = [
    azurerm_api_management_backend.app_backend,
    azurerm_api_management_named_value.app_backend_apim_key
  ]
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


################
# Named Values #
################

resource "azurerm_api_management_named_value" "app_backend_apim_key" {
  name                = "appbe-host-key-for-apim-platform"
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  display_name        = "appbe-host-key-for-apim-platform"
  value               = var.appbe_host_key_for_apim_platform
  secret              = true
}

############
# Backends #
############
resource "azurerm_api_management_backend" "app_backend" {
  name                = var.app_backend_name
  description         = "IO Services App Backend"
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  protocol            = "http"
  url                 = "https://${var.app_backend_hostname}"
}
