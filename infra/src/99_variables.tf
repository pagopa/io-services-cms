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
# CosmosDB #
############

variable "cosmos_private_endpoint_enabled" {
  type = bool
}

variable "cosmos_public_network_access_enabled" {
  type = bool
}


#############
# IO Common #
#############

variable "io_common" {
  type = object({
    resource_group_name = string
    # Network
    vnet_name = string
    # Monitor
    application_insights_name = string
    action_group_email_name   = string
    action_group_slack_name   = string
  })
  description = "Name of common resources of IO platform"
}
