data "azurerm_client_config" "current" {}

data "azuread_group" "adgroup_admin" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-admin"
}

data "azuread_group" "adgroup_services_cms" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-services-cms"
}

data "azuread_group" "github_action_iac" {
  display_name = "${var.prefix}-${var.env_short}-directory-readers"
}

data "azurerm_api_management" "apim_v2" {
  name                = "${var.prefix}-${var.env_short}-apim-v2-api"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-internal"
}

data "azurerm_user_assigned_identity" "managed_identity_infra_ci" {
  name                = "${var.prefix}-${var.env_short}-services-cms-github-ci-identity"
  resource_group_name = "${var.prefix}-${var.env_short}-identity-rg"
}

data "azurerm_user_assigned_identity" "managed_identity_infra_cd" {
  name                = "${var.prefix}-${var.env_short}-services-cms-github-cd-identity"
  resource_group_name = "${var.prefix}-${var.env_short}-identity-rg"
}