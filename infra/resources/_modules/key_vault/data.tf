data "azurerm_client_config" "current" {}

data "azuread_group" "adgroup_admin" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-admin"
}

data "azuread_group" "adgroup_svc_admins" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-svc-admins"
}

data "azuread_group" "adgroup_svc_developers" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-svc-developers"
}

data "azurerm_user_assigned_identity" "managed_identity_infra_ci" {
  name                = "${var.prefix}-${var.env_short}-itn-svc-infra-github-ci-id-01"
  resource_group_name = var.resource_group_name
}

data "azurerm_user_assigned_identity" "managed_identity_infra_cd" {
  name                = "${var.prefix}-${var.env_short}-itn-svc-infra-github-cd-id-01"
  resource_group_name = var.resource_group_name
}

# APIM itn

data "azurerm_api_management" "apim_itn" {
  name                = "${var.prefix}-${var.env_short}-itn-apim-01"
  resource_group_name = "${var.prefix}-${var.env_short}-itn-common-rg-01"
}

# TODO: remove this data source once E&S's endpoints have been removed from io-backend
# temporary used to "clone" a secret to be used by io-infra CI/CD
data "azurerm_key_vault" "common" {
  name                = "io-p-kv-common"
  resource_group_name = "io-p-rg-common"
}
