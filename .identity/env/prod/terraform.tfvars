env       = "prod"
env_short = "p"
prefix    = "io"

environment_cd_roles = {
  subscription = [
    "Reader",
    "DocumentDB Account Contributor", # remove after services collection migration from io-p-cosmos-api
  ]
  resource_groups = {
    terraform-state-rg = [
      "Storage Blob Data Contributor",
    ],
    io-p-services-cms-rg = [
      "Contributor",
    ]
  }
}

environment_ci_roles = {
  subscription = [
    "Reader",
    "DocumentDB Account Contributor", # remove after services collection migration from io-p-cosmos-api
  ]
  resource_groups = {
    terraform-state-rg = [
      "Storage Blob Data Reader",
    ],
    io-p-services-cms-rg = [
      "DocumentDB Account Contributor",
    ]
  }
}

github_repository_environment_ci = {
  protected_branches     = false
  custom_branch_policies = true
}

github_repository_environment_cd = {
  protected_branches     = true
  custom_branch_policies = false
  reviewers_teams        = ["io-platform-green-unit"]
}
