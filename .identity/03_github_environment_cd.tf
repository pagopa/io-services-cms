resource "github_repository_environment" "github_repository_environment_cd" {
  environment = "app-${var.env}-cd"
  repository  = github_repository.this.name
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

resource "github_actions_environment_secret" "env_cd_secrets" {
  for_each        = local.app_env_cd_secrets
  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

