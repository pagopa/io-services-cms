resource "github_repository_environment" "github_repository_environment_app_cd" {
  environment = "${var.env}-app-cd"
  repository  = var.github.repository
  # filter teams reviewers from github_organization_teams
  # if reviewers_teams is null no reviewers will be configured for environment
  dynamic "reviewers" {
    for_each = (var.github_repository_environment_app_cd.reviewers_teams == null ? [] : [1])
    content {
      teams = matchkeys(
        data.github_organization_teams.all.teams[*].id,
        data.github_organization_teams.all.teams[*].slug,
        var.github_repository_environment_app_cd.reviewers_teams
      )
    }
  }
  deployment_branch_policy {
    protected_branches     = var.github_repository_environment_app_cd.protected_branches
    custom_branch_policies = var.github_repository_environment_app_cd.custom_branch_policies
  }
}

# TODO: delete
resource "github_actions_environment_secret" "azure_app_cd_client_id" {
  repository      = var.github.repository
  environment     = "${var.env}-app-cd"
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azuread_service_principal.environment_app_cd.application_id
}
