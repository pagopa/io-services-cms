# Azure AD
data "azuread_group" "adgroup_admin" {
  display_name = format("%s-adgroup-svc-admins", local.project)
}

data "azuread_group" "adgroup_developers" {
  display_name = format("%s-adgroup-svc-developers", local.project)
}

data "azuread_group" "adgroup_security" {
  display_name = format("%s-adgroup-security", local.project)
}

data "azuread_group" "adgroup_services_cms" {
  display_name = format("%s-adgroup-services-cms", local.project)
}

# User Assigned Managed Identity
data "azurerm_user_assigned_identity" "infra_ci" {
  name = format("%s-itn-svc-infra-github-ci-id-01", local.project)
  resource_group_name = data.azurerm_resource_group.svc_itn_01.name
}

data "azurerm_user_assigned_identity" "infra_cd" {
  name = format("%s-itn-svc-infra-github-cd-id-01", local.project)
  resource_group_name = data.azurerm_resource_group.svc_itn_01.name
}

# Resource Groups
data "azurerm_resource_group" "svc_itn_01" {
  name = format("%s-itn-svc-rg-01", local.project)
}
