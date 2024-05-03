resource "github_repository_environment" "github_repository_environment_infra_ci" {
  environment = "${var.env}-ci"
  repository  = github_repository.this.name
}

resource "github_repository_environment" "github_repository_environment_infra_cd" {
  environment = "${var.env}-cd"
  repository  = github_repository.this.name
  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

resource "github_actions_environment_secret" "infra_env_ci_secrets" {
  for_each        = local.env_ci_secrets
  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_infra_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "infra_env_cd_secrets" {
  for_each        = local.env_cd_secrets
  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_infra_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}
