env       = "prod"
env_short = "p"
prefix    = "io"

environment_cd_roles = {
  subscription = [
    "Reader",
  ]
  resource_groups = {
    io-p-services-cms-rg = [
      "Website Contributor",
      "Key Vault Secrets User"
    ]
  }
}

github_repository_environment_cd = {
  protected_branches     = true
  custom_branch_policies = false
  reviewers_teams        = ["io-platform-green-unit"]
}
