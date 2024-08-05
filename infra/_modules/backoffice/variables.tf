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
  description = "Resource group name for the Function App services"
}

################
#  Networking  #
################
variable "virtual_network" {
  type = object({
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

###########################
#  Azure KeyVault Secrets #
###########################
variable "bo_auth_session_secret" {
  type        = string
  description = "Backoffice Auth Session Secret"
}

variable "azure_client_secret_credential_client_id" {
  type        = string
  description = "Azure Client Secret Credential Client Id"
}

variable "azure_client_secret_credential_secret" {
  type        = string
  description = "Azure Client Secret Credential Secret"
}

variable "legacy_cosmosdb_key" {
  type        = string
  description = "Legacy CosmosDB Key"
}

variable "selfcare_api_key" {
  type        = string
  description = "Selfcare API Key"
}

variable "subscription_migration_api_key" {
  type        = string
  description = "Subscription Migration API Key"
}


######################
#  CMS Function App  #
######################
variable "cms_fn_default_hostname" {
  type        = string
  description = "Service CMS Function App Default Hostname Property"
}
