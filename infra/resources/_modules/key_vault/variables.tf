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

variable "bo_auth_session_secret_rotation_id" {
  type        = string
  default     = "1695908210722"
  description = "You can renew the backoffice auth session secret by using a new, never-used-before value (hint: use the current timestamp)"
}

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
