resource "github_repository_environment" "github_repository_environment_ci" {
  environment = "app-${var.env}-ci"
  repository  = github_repository.this.name
  deployment_branch_policy {
    protected_branches     = var.github_repository_environment_ci.protected_branches
    custom_branch_policies = var.github_repository_environment_ci.custom_branch_policies
  }
}

resource "github_actions_environment_secret" "env_ci_secrets" {
  for_each        = local.app_env_ci_secrets
  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}
