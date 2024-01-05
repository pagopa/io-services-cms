resource "github_repository_environment" "github_repository_environment_ci" {
  environment = "${var.env}-ci"
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = var.github_repository_environment_ci.protected_branches
    custom_branch_policies = var.github_repository_environment_ci.custom_branch_policies
  }
}


resource "github_actions_environment_secret" "env_ci_secrets" {
  for_each        = local.env_ci_secrets
  repository      = var.github.repository
  environment     = github_repository_environment.github_repository_environment_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}


# TODO: Delete
resource "github_actions_environment_secret" "azure_ci_client_id" {
  repository      = var.github.repository
  environment     = "${var.env}-ci"
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azuread_service_principal.environment_ci.application_id
}
