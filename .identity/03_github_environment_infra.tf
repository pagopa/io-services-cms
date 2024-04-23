resource "github_repository_environment" "github_repository_environment_infra_ci" {
  environment = "${var.env}-ci"
  repository  = var.github.repository
}

resource "github_repository_environment" "github_repository_environment_infra_cd" {
  environment = "${var.env}-cd"
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

resource "github_actions_environment_secret" "infra_env_ci_secrets" {
  for_each        = local.infra_env_ci_secrets
  repository      = var.github.repository
  environment     = github_repository_environment.github_repository_environment_infra_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "infra_env_cd_secrets" {
  for_each        = local.infra_env_cd_secrets
  repository      = var.github.repository
  environment     = github_repository_environment.github_repository_environment_infra_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}
