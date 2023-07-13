data "azurerm_api_management" "apim" {
  name                = var.azure_apim
  resource_group_name = var.azure_apim_resource_group
}

data "azurerm_api_management_product" "apim_product_services" {
  product_id          = var.azure_apim_product_id
  api_management_name = var.azure_apim
  resource_group_name = var.azure_apim_resource_group
}

data "azurerm_api_management" "apim_v2" {
  name                = var.azure_apim_v2
  resource_group_name = var.azure_apim_resource_group
}

data "azurerm_api_management_product" "apim_v2_product_services" {
  product_id          = var.azure_apim_product_id
  api_management_name = var.azure_apim_v2
  resource_group_name = var.azure_apim_resource_group
}
