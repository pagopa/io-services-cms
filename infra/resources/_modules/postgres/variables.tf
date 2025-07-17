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

variable "location_short" {
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
  description = "Resource group name for the Function App services"
}

variable "application_basename" {
  type        = string
  description = "Name of the application"
}

################
#  Networking  #
################

variable "virtual_network" {
  type = object({
    id                  = string
    name                = string
    resource_group_name = string
  })
  description = "Virtual network to create subnet in"
}

variable "peps_snet_id" {
  type        = string
  description = "Id of the subnet which holds private endpoints"
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  description = "Resource group name of the private DNS zone to use for private endpoints"
}

variable "cms_fn_name" {
  type        = string
  description = "Name of the Services CMS Function App"
}

variable "cms_fn_principal_id" {
  type        = string
  description = "Principal ID of the Services CMS Function App"
}

variable "key_vault_id" {
  type        = string
  description = "Azure KeyVault ID"
}

############
# Postgres #
############

variable "postgres_admin_credentials_rotation_id" {
  type        = string
  default     = "1682602957131"
  description = "You can renew admin credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp)"
}

variable "postgres_reviewer_usr_credentials_rotation_id" {
  type        = string
  default     = "1682602957131"
  description = "You can renew reviewer user credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp)"
}

variable "postgres_readonly_usr_credentials_rotation_id" {
  type        = string
  default     = "1682602957131"
  description = "You can renew readonly user credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp)"
}

