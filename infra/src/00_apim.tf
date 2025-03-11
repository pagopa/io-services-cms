data "azurerm_api_management" "apim_itn" {
  name                = local.apim_name_itn
  resource_group_name = local.apim_resource_group_name_itn
}

data "azurerm_api_management_product" "apim_itn_product_services" {
  product_id          = var.azure_apim_product_id
  api_management_name = local.apim_name_itn
  resource_group_name = local.apim_resource_group_name_itn
}

data "azurerm_linux_function_app" "itn_webapp_functions_app" {
  name                = "${local.common_project_itn}-svc-cms-func-01"
  resource_group_name = "${local.common_project_itn}-svc-rg-01"
}
