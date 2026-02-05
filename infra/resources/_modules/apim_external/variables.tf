variable "api_management" {
  type = object({
    name                = string
    resource_group_name = string
    product_id          = string
  })
  description = "API Management reference"
}

variable "cms_hostname" {
  type        = string
  description = "Service CMS Hostname"
}

variable "ai_instrumentation_key" {
  type        = string
  description = "Application Insights Instrumentation Key"
  sensitive   = true
}
