variable "api_management" {
  type = object({
    id                  = string
    name                = string
    resource_group_name = string
    product_id          = string
  })
  description = "API Management reference"
}

variable "app_backend_hostname" {
  type        = string
  description = "Services APP Backend Hostname"
}

variable "app_backend_name" {
  type        = string
  description = "Services APP Backend Name"
}

variable "appbe_host_key_for_apim_platform" {
  type        = string
  description = "Services APP Backend Key for APIM Platform"
  sensitive   = true
}
