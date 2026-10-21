resource "azurerm_api_management_api_version_set" "services_internal_v1" {
  name                = "io-services-internal-v1"
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name
  display_name        = "IO Services Internal v1"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "services_internal" {
  name                  = "io-services-internal-api"
  api_management_name   = var.api_management.name
  resource_group_name   = var.api_management.resource_group_name
  subscription_required = true

  version_set_id = azurerm_api_management_api_version_set.services_internal_v1.id
  version        = "v1"
  revision       = "1"

  description  = "IO Services API for internal consumers"
  display_name = "IO Services Internal"
  path         = "api/services/internal"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/io-services-cms/ba7d26e3826e027e248c20796147dd8e8f592b64/apps/services-app/api/m2m-internal.yaml"
  }
}

# Never associate this API with an open product: it would allow calls without a key.
resource "azurerm_api_management_product" "services_internal" {
  product_id            = "io-services-internal"
  api_management_name   = var.api_management.name
  resource_group_name   = var.api_management.resource_group_name
  display_name          = "IO Services Internal"
  description           = "Subscription-protected APIs for internal IO service consumers"
  subscription_required = true
  approval_required     = true
  published             = false
}

resource "azurerm_api_management_product_api" "services_internal" {
  product_id          = azurerm_api_management_product.services_internal.product_id
  api_name            = azurerm_api_management_api.services_internal.name
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name
}

# Allows the Messages domain to invoke the internal Services APIs.
# Omit user_id to create a standalone subscription; APIM generates both keys.
resource "azurerm_api_management_subscription" "messages_services_internal" {
  subscription_id     = "messages-services-internal"
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name
  product_id          = azurerm_api_management_product.services_internal.id
  display_name        = "Messages Domain - Internal Services"
  state               = "active"
  allow_tracing       = false
}

resource "azurerm_api_management_backend" "services_internal" {
  name                = "io-services-internal"
  title               = "IO Services Internal"
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name
  protocol            = "http"
  url                 = "https://${var.services_app_hostname}"
}

resource "azurerm_api_management_api_policy" "services_internal" {
  api_name            = azurerm_api_management_api.services_internal.name
  api_management_name = var.api_management.name
  resource_group_name = var.api_management.resource_group_name

  xml_content = templatefile("${path.module}/api/services_internal/v1/policy.xml", {
    backend_id = azurerm_api_management_backend.services_internal.name
  })
}
