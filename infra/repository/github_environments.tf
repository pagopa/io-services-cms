resource "github_repository_environment" "release" {
  environment = "release"
  repository  = module.repo.repository.name

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "release_branch" {
  repository     = module.repo.repository.name
  environment    = github_repository_environment.release.environment
  branch_pattern = "master"
}
