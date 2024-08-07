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
variable "bo_snet_cidr" {
  type        = string
  description = "Backoffice Subnet CIDR"
}

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

variable "key_vault_id" {
  type        = string
  description = "Azure KeyVault ID"
}
variable "bo_auth_session_secret_name" {
  type        = string
  description = "Backoffice Auth Session Secret Name"
}

variable "azure_client_secret_credential_client_id_name" {
  type        = string
  description = "Azure Client Secret Credential Client Id Name"
}

variable "azure_client_secret_credential_secret_name" {
  type        = string
  description = "Azure Client Secret Credential Secret Name"
}

variable "legacy_cosmosdb_key_name" {
  type        = string
  description = "Legacy CosmosDB Key Name"
}

variable "selfcare_api_key_name" {
  type        = string
  description = "Selfcare API Key Name"
}

variable "subscription_migration_api_key_name" {
  type        = string
  description = "Subscription Migration API Key Name"
}


######################
#  CMS Function App  #
######################
variable "cms_fn_default_hostname" {
  type        = string
  description = "Service CMS Function App Default Hostname Property"
}
