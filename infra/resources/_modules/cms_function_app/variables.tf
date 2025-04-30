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

variable "pgres_flex_reviewer_usr_pwd_name" {
  type        = string
  description = "Postgres User Name"
}

variable "jira_token_name" {
  type        = string
  description = "Connection Token to Jira"
}

variable "azure_client_secret_credential_client_id_name" {
  type        = string
  description = "Azure Client Secret Credential Client Id Name"
}

variable "azure_client_secret_credential_secret_name" {
  type        = string
  description = "Azure Client Secret Credential Secret Name"
}

variable "serviceid_quality_check_exclusion_list_name" {
  type        = string #corretto?
  description = "Service quality check exclusion list"
}

variable "legacy_cosmosdb_connectionstring_name" {
  type        = string
  description = "Legacy comsmos db connection string name"
}

variable "legacy_cosmosdb_key_name" {
  type        = string
  description = "Legacy CosmosDB Key Name"
}

variable "asset_storage_connectionstring_secret_name" {
  type        = string
  description = "Asset storage connection string Name"
}

variable "services_publication_event_hub_connection_string_name" {
  type        = string
  description = "Publication event hub connection string Name"
}

variable "services_topics_event_hub_connection_string_name" {
  type        = string
  description = "Topics event hub connection string Name"
}

variable "services_lifecycle_event_hub_connection_string_name" {
  type        = string
  description = "Lifecycle event hub connection string Name"
}

variable "services_history_event_hub_connection_string_name" {
  type        = string
  description = "History event hub connection string Name"
}

variable "activations_event_hub_connection_string_name" {
  type        = string
  description = "Activations event hub connection string Name"
}

variable "eh_sc_connectionstring_name" {
  type        = string
  description = "event hub connection string Name"
}

variable "pdv_tokenizer_api_key_name" {
  type        = string
  description = "PDV token"
}