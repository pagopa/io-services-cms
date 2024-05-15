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

#####################
#  Azure AI Search  #
#####################

variable "public_network_access_enabled" {
  description = "Specifies whether Public Network Access is allowed for this resource"
  default     = false
  type        = bool
}

variable "replica_count" {
  type        = number
  description = "Replicas distribute search workloads across the service. You need at least two replicas to support high availability of query workloads (not applicable to the free tier)."
  validation {
    condition     = var.replica_count >= 1 && var.replica_count <= 12
    error_message = "The replica_count must be between 1 and 12."
  }
}

variable "partition_count" {
  type        = number
  description = "Partitions allow for scaling of document count as well as faster indexing by sharding your index over multiple search units."
  validation {
    condition     = contains([1, 2, 3, 4, 6, 12], var.partition_count)
    error_message = "The partition_count must be one of the following values: 1, 2, 3, 4, 6, 12."
  }
}

variable "snet_id" {
  type        = string
  description = "Subnet ID where to locate the ai search private endpoint"
}

variable "cosmos_database_name" {
  type        = string
  description = "Name of the cosmos database"
  default     = "db-services-cms"
}

variable "index_aliases" {
  type        = map(string)
  description = "The aliases to create on each index"
  default = {
    organizations = "organizations"
    services      = "services"
  }
}

variable "indexers_scheduling_interval" {
  type        = map(string)
  description = "The indexers scheduling intervals"

  default = {
    organizations        = "PT1H"
    services_lifecycle   = "PT1H"
    services_publication = "PT1H"
  }
}