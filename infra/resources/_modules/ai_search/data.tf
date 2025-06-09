data "azurerm_subscription" "current" {}

data "azurerm_private_dns_zone" "privatelink_srch" {
  name                = "privatelink.search.windows.net"
  resource_group_name = var.private_dns_zone_resource_group_name
}

data "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-${var.env_short}-cosmos-services-cms"
  resource_group_name = "${var.prefix}-${var.env_short}-services-cms-rg"
}

data "azuread_group" "adgroup_admin" {
  display_name = "${var.prefix}-${var.env_short}-adgroup-svc-admins"
}

data "azuread_group" "adgroup_developers" {
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

data "azurerm_monitor_action_group" "error_action_group_common" {
  name                = "${var.prefix}${var.env_short}error"
  resource_group_name = "${var.prefix}-${var.env_short}-rg-common"
}
