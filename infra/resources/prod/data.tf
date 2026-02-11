data "azurerm_resource_group" "weu-common" {
  name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_resource_group" "evt-rg" {
  name = "${local.prefix}-${local.env_short}-evt-rg"
}

data "azurerm_virtual_network" "itn_common" {
  name                = "${local.project}-common-vnet-01"
  resource_group_name = "${local.project}-common-rg-01"
}

data "azurerm_subnet" "private_endpoints_subnet" {
  name                 = "${local.project}-pep-snet-01"
  virtual_network_name = data.azurerm_virtual_network.itn_common.name
  resource_group_name  = data.azurerm_virtual_network.itn_common.resource_group_name
}

data "azurerm_application_insights" "ai_common" {
  name                = "${local.prefix}-${local.env_short}-ai-common"
  resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_resource_group" "rg" {
  name = "${local.project}-${local.application_basename}-rg-01"
}

data "azurerm_log_analytics_workspace" "common" {
  name                = "${local.prefix}-${local.env_short}-law-common"
  resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_api_management" "apim_external" {
  name                = "${local.project}-apim-01"
  resource_group_name = "${local.project}-common-rg-01"
}

data "azurerm_api_management_product" "apim_external_product_services" {
  product_id          = "io-services-api"
  api_management_name = data.azurerm_api_management.apim_external.name
  resource_group_name = data.azurerm_api_management.apim_external.resource_group_name
}

data "azurerm_api_management" "apim_platform" {
  name                = "${local.project}-platform-api-gateway-apim-01"
  resource_group_name = "${local.project}-common-rg-01"
}

data "azurerm_api_management_product" "apim_platform_product_services" {
  product_id          = "io-institutions"
  api_management_name = data.azurerm_api_management.apim_platform.name
  resource_group_name = data.azurerm_api_management.apim_platform.resource_group_name
}
