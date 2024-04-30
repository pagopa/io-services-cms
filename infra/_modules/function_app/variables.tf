######################
#  Common Variables  #
######################

variable "prefix" {
  type    = string
  default = "io"
  validation {
    condition = (
      length(var.prefix) < 6
    )
    error_message = "Max length is 6 chars."
  }
}

variable "env_short" {
  type = string
  validation {
    condition = (
      length(var.env_short) <= 1
    )
    error_message = "Max length is 1 chars."
  }
}

variable "project" {
  type        = string
  description = "IO prefix, short environment and short location"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name for the Function App services"
}

variable "application_basename" {
  type        = string
  description = "Name of the application"
}

##################
#  Function App  #
##################

variable "app_be_snet_id" {
  type        = string
  description = "Subnet ID where to locate the App BE Fn App"
}

variable "ai_search_id" {
  type        = string
  description = "ID of the AI Search"
}

variable "cosmos_database_name" {
  type        = string
  description = "Name of the cosmos database"
  default     = "db-services-cms"
}


variable "fn_sku_tier" {
  type        = string
  description = "App service plan sku tier"
  default     = "PremiumV3"
}

variable "fn_sku_size" {
  type        = string
  description = "App service plan sku size"
  default     = "P1v3"
}

variable "fn_worker_count" {
  type        = number
  description = "The number of Workers (instances) to be allocated"
  default     = 1
}

variable "fn_zone_balancing_enabled" {
  type        = bool
  description = "Should the Service Plan balance across Availability Zones in the region. Changing this forces a new resource to be created"
  default     = true
}
