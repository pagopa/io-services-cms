data "azurerm_resource_group" "environment_cd_resource_groups" {
  for_each = toset([for rg, role_list in var.environment_cd_roles.resource_groups : rg])
  name     = each.value
}

data "azurerm_resource_group" "github_runner_rg" {
  name = "${var.prefix}-${var.env_short}-github-runner-rg"
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}
