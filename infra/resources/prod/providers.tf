terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "iopitntfst001"
    container_name       = "terraform-state"
    key                  = "io-services-cms.prod.italynorth.tfstate"
    use_azuread_auth     = true
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }

    restapi = { # Approved as temporary solution due to lack of support from azurerm provider
      source  = "Mastercard/restapi"
      version = "<= 1.19.1"
    }

    azuread = {
      source  = "hashicorp/azuread"
      version = "2.48.0"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = "~> 0.4"
    }
  }
}

provider "azurerm" {
  features {}
  storage_use_azuread = true
}

provider "dx" {}
