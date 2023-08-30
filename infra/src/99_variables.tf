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
  type    = string
  default = "westeurope"
}

variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}


############
# Postgres #
############

variable "cidr_subnet_pgres" {
  type        = string
  description = "Subnet address space."
}


############
# CosmosDB #
############

variable "cosmos_private_endpoint_enabled" {
  type = bool
}

variable "cosmos_public_network_access_enabled" {
  type = bool
}


########
# APIM #
########

variable "azure_apim" {
  type        = string
  description = "APIM resource name."
  default     = null
}

variable "azure_apim_v2" {
  type        = string
  description = "APIM v2 resource name."
  default     = null
}

variable "azure_apim_resource_group" {
  type        = string
  description = "APIM resource group name."
  default     = null
}

variable "azure_apim_product_id" {
  type        = string
  description = "APIM Services Product id."
  default     = null
}


#############################
# Cosmos DB Legacy Services #
#############################

variable "legacy_cosmosdb_name" {
  type        = string
  description = "The name of the database where legacy data is"
}

variable "legacy_cosmosdb_uri" {
  type        = string
  description = "The uri of the database where legacy data is"
}

variable "legacy_cosmosdb_container_services" {
  type        = string
  description = "The collection of the database where legacy data is"
  default     = "services"
}

variable "legacy_cosmosdb_container_services_lease" {
  type        = string
  description = "The lease collection that keeps track of our reads to the service collection change feed"
  default     = "services-cms--legacy-watcher-lease"
}

variable "legacy_service_watcher_max_items_per_invocation" {
  type        = number
  description = "Chunck size for the change feed"
}


############
## Monitor #
############

variable "application_insights_name" {
  type        = string
  description = "The common Application Insights name"
}

variable "monitor_resource_group_name" {
  type        = string
  description = "Monitor resource group name"
}

variable "monitor_action_group_email_name" {
  type        = string
  description = "The email to send alerts to"
}

variable "monitor_action_group_slack_name" {
  type        = string
  description = "The slack channel to send alerts to"
}

###########
# network #
###########

variable "vnet_common_rg" {
  type        = string
  description = "Common Virtual network resource group name."
  default     = ""
}

variable "vnet_name" {
  type        = string
  description = "Common Virtual network resource name."
  default     = ""
}


###############################
# Feature Flags Configuration #
###############################

variable "userid_cms_to_legacy_sync_inclusion_list" {
  type        = string
  description = "User Ids to include in the sync from CMS to legacy"
}

variable "userid_legacy_to_cms_sync_inclusion_list" {
  type        = string
  description = "User Ids to include in the sync from legacy to CMS"
}

variable "userid_request_review_legacy_inclusion_list" {
  type        = string
  description = "User Ids to include in the request review from legacy services"
}

variable "userid_automatic_service_approval_inclusion_list" {
  type        = string
  description = "User Ids allowed to automatic service approval"
}