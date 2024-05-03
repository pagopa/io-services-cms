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
  description = "Resource group name for the AI Search services"
}

variable "application_basename" {
  type        = string
  description = "Name of the application"
}

################
#  Networking  #
################
variable "vnet_name" {
  type        = string
  description = "Name of the vnet where to deploy the networking"
}

variable "srch_snet_cidrs" {
  type        = list(string)
  description = "The CIDR address prefixes of the subnet where to deploy the ai search service"
}

variable "app_be_snet_cidrs" {
  type        = list(string)
  description = "The CIDR address prefixes of the subnet where to deploy the app be"
}
