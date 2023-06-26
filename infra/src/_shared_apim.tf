variable "azure_apim" {
  type        = string
  description = "APIM resource name."
  default     = null
}

variable "azure_apim_resource_group" {
  type        = string
  description = "APIM resource group name."
  default     = null
}

variable "azure_apim_product_id" {
  type        = string
  description = "APIM Services Product id."
  default     = "io-services-api"
}


data "azurerm_api_management" "apim" {
  name                = var.azure_apim
  resource_group_name = var.azure_apim_resource_group
}

data "azurerm_api_management_product" "apim_product_services" {
  product_id          = var.azure_apim_product_id
  api_management_name = var.azure_apim
  resource_group_name = var.azure_apim_resource_group
}
