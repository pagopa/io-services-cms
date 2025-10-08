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

variable "location" {
  type        = string
  description = "Azure region"
}

variable "domain" {
  type        = string
  description = "Domain name of the application"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name for the services"
}

################
#  Networking  #
################

variable "peps_snet_id" {
  type        = string
  description = "Id of the subnet which holds private endpoints"
}

variable "virtual_network" {
  type = object({
    name                = string
    resource_group_name = string
  })
  description = "Virtual Network where the subnet should be created"
}

variable "subnet_cidr" {
  type        = string
  description = "Subnet CIDR for Container App Environment"
}

variable "private_dns_zone_resource_group_id" {
  type        = string
  description = "Resource group id of the private DNS zone to use for private endpoints"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Id of the Log Analytics Workspace to use for Container Apps diagnostics"
}

variable "key_vault" {
  type = object({
    name                = string
    resource_group_name = string
    use_rbac            = optional(bool, false)
  })
  description = "KeyVault to use to store Function host keys"
}

variable "appi_connection_string" {
  type        = string
  sensitive   = true
  description = "Application Insights connection string"
}


##################
#  Function App  #
##################
variable "ai_search" {
  type = object({
    id                     = string
    url                    = string
    service_version        = string
    institution_index_name = string
    services_index_name    = string
  })
  description = "AI Search input parameters"
}
