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

################
#  Networking  #
################
variable "cms_snet_cidr" {
  type        = string
  description = "CMS Subnet CIDR"
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

variable "ai_common_connection_string" {
  type        = string
  description = "Application Insights connection string"
  sensitive   = true
}

variable "bo_snet_cidr" {
  type        = string
  description = "Backoffice Subnet CIDR"
}

###########################
#  Azure KeyVault Secrets #
###########################

variable "key_vault_id" {
  type        = string
  description = "Azure KeyVault ID"
}

variable "cms_pgres_reviewer_usr_pwd" {
  type        = string
  description = "Postgres Password for CMS Reviewer User"
  sensitive   = true
}

variable "jira_token_name" {
  type        = string
  description = "Connection Token to Jira"
}

variable "serviceid_quality_check_exclusion_list_name" {
  type        = string
  description = "Service quality check exclusion list"
}

variable "asset_storage_connectionstring_secret_name" {
  type        = string
  description = "Asset storage connection string Name"
}

variable "eh_sc_connectionstring_name" {
  type        = string
  description = "event hub connection string Name"
}

variable "pdv_tokenizer_api_key_name" {
  type        = string
  description = "PDV token"
}

variable "selfcare_api_key_name" {
  type        = string
  description = "Selfcare API Key Name"
}


################
#  Monitoring  #
################

variable "error_action_group_id" {
  description = "Id of the action group to use for error notifications"
  type        = string
}


variable "pgres_cms_fqdn" {
  description = "FQDN of the CMS Postgres Flexible Server"
  type        = string
}
