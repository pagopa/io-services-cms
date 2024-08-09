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


###########
# Network #
###########

variable "subnets_cidrs" {
  type = object({
    api        = list(string)
    postgres   = list(string)
    backoffice = list(string)
  })
  description = "The CIDR address prefixes of the subnets"
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


########
# APIM #
########


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

variable "reviewer_db_name" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_user" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_schema" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_table" {
  type        = string
  description = ""
  default     = null
}

variable "topic_db_schema" {
  type        = string
  description = ""
  default     = null
}

variable "topic_db_table" {
  type        = string
  description = ""
  default     = null
}


#############################
# Cosmos DB Legacy Services #
#############################

variable "legacy_cosmosdb_resource_group" {
  type        = string
  description = "The name of the resource group where legacy data is"
}

variable "legacy_cosmosdb_resource_name" {
  type        = string
  description = "The name of the resource where legacy data is"
}

variable "legacy_cosmosdb_name" {
  type        = string
  description = "The name of the database where legacy data is"
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


#############
# IO Common #
#############

variable "io_common" {
  type = object({
    resource_group_name = string
    # Network
    vnet_name            = string
    appgateway_snet_name = string
    # Monitor
    application_insights_name = string
    action_group_email_name   = string
    action_group_slack_name   = string
  })
  description = "Name of common resources of IO platform"
}

variable "bo_auth_session_secret_rotation_id" {
  type        = string
  default     = "1695908210722"
  description = "You can renew the backoffice auth session secret by using a new, never-used-before value (hint: use the current timestamp)"
}

#####################
# container app job #
#####################

variable "container_app_environment" {
  type = object({
    name                = string
    resource_group_name = string
  })
}

variable "key_vault_common" {
  type = object({
    resource_group_name = string
    name                = string
    pat_secret_name     = string
  })
}
