# Azure AD
data "azuread_group" "adgroup_admin" {
  display_name = format("%s-adgroup-admin", local.project)
}

data "azuread_group" "adgroup_developers" {
  display_name = format("%s-adgroup-developers", local.project)
}

data "azuread_group" "adgroup_externals" {
  display_name = format("%s-adgroup-externals", local.project)
}

data "azuread_group" "adgroup_security" {
  display_name = format("%s-adgroup-security", local.project)
}

data "azuread_group" "adgroup_services_cms" {
  display_name = format("%s-adgroup-services-cms", local.project)
}

data "azuread_service_principal" "github_action_iac_ci" {
  display_name = "github-pagopa-io-services-cms-prod-ci"
}

data "azuread_service_principal" "github_action_iac_cd" {
  display_name = "github-pagopa-io-services-cms-prod-cd"
}
