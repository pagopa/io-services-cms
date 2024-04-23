terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "iopitntfst001"
    container_name       = "terraform-state"
    key                  = "io-services-cms.prod.italynorth.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.99.0"
    }

    restapi = {
      source = "Mastercard/restapi"
      version = "<= 1.19.1"
    }
  }
}

provider "azurerm" {
  features {}
}
