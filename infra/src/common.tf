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

locals {
  project              = "${var.prefix}-${var.env_short}"
  is_prod              = var.env_short == "p" ? true : false
  application_basename = "services-cms"
  cosmos_containers = {
    services_lifecycle   = "services-lifecycle"
    services_publication = "services-publication"
    services_history     = "services-history"
  }
}
