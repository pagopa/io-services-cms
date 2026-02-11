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
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/io-services-cms/9b841ae4b757a15214636c7d3f3b122e47b0ec7c/apps/app-backend/api/external.yaml"
  }
}


###############
# API Product #
###############

resource "azurerm_api_management_product_api" "app_backend" {
  product_id          = var.api_management.product_id
  api_name            = azurerm_api_management_api.api_services_app_backend.name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
}


##########
# Policy #
##########

resource "azurerm_api_management_api_policy" "app_backend" {
  api_name            = azurerm_api_management_api.api_services_app_backend.name
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name

  xml_content = file("${path.module}/api/app_backend/v1/policy.xml")

  depends_on = [
    azurerm_api_management_backend.app_backends,
    azurerm_api_management_named_value.app_backend_apim_key
  ]
}

############
# Backends #
############
resource "azurerm_api_management_backend" "app_backends" {
  count               = length(var.app_backend_hostnames)
  title               = "IO Services App Backend ${count.index + 1}"
  name                = "${var.app_backend_name}-${count.index + 1}"
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  protocol            = "http"
  url                 = "https://${var.app_backend_hostnames[count.index]}"
}

resource "azapi_resource" "app_backend_pool" {
  type      = "Microsoft.ApiManagement/service/backends@2024-06-01-preview"
  name      = "io-services-app-backend-pool"
  parent_id = var.api_management.id
  body = {
    properties = {
      protocol    = null
      url         = null
      type        = "Pool"
      description = "Load Balancer of IO Services App Backend"
      pool = {
        services = [
          for backend in azurerm_api_management_backend.app_backends : {
            id = backend.id
          }
        ]
      }
    }
  }
}


################
# Named Values #
################

resource "azurerm_api_management_named_value" "app_backend_apim_key" {
  name                = "svc-appbe-host-key"
  api_management_name = azurerm_api_management_api.api_services_app_backend.api_management_name
  resource_group_name = azurerm_api_management_api.api_services_app_backend.resource_group_name
  display_name        = "svc-appbe-host-key"
  value               = var.appbe_host_key_for_apim_platform
  secret              = true
}
