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


##########
# Webapp #
##########

variable "functions_kind" {
  type        = string
  description = "App service plan kind"
  default     = null
}

variable "functions_sku_tier" {
  type        = string
  description = "App service plan sku tier"
  default     = null
}

variable "functions_sku_size" {
  type        = string
  description = "App service plan sku size"
  default     = null
}

variable "functions_autoscale_minimum" {
  type        = number
  description = "The minimum number of instances for this resource."
  default     = 1
}

variable "functions_autoscale_maximum" {
  type        = number
  description = "The maximum number of instances for this resource."
  default     = 30
}

variable "functions_autoscale_default" {
  type        = number
  description = "The number of instances that are available for scaling if metrics are not available for evaluation."
  default     = 1
}

variable "jira_namespace_url" {
  type        = string
  description = ""
  default     = null
}

variable "jira_project_name" {
  type        = string
  description = ""
  default     = null
}

variable "jira_username" {
  type        = string
  description = ""
  default     = null
}

variable "jira_contract_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_delegate_email_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_delegate_name_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_organization_cf_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "jira_organization_name_custom_field" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_name" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_schema" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_user" {
  type        = string
  description = ""
  default     = null
}

variable "reviewer_db_table" {
  type        = string
  description = ""
  default     = null
}

variable "legacy_jira_project_name" {
  type        = string
  description = ""
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

##############
# backoffice #
##############

variable "backoffice_app" {
  type = object({
    sku_name = string
  })
  description = "Configuration of the io-services-cms-backoffice service"
}

variable "bo_auth_session_secret_rotation_id" {
  type        = string
  default     = "1695908210722"
  description = "You can renew the backoffice auth session secret by using a new, never-used-before value (hint: use the current timestamp)"
}