terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "<= 2.47.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.106.0"
    }
    github = {
      source  = "integrations/github"
      version = "<= 5.43.0"
    }
  }

  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

provider "github" {
  owner = "pagopa"
}

data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}
