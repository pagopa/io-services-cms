env       = "prod"
env_short = "p"
prefix    = "io"

environment_cd_roles = {
  subscription = [
    "Contributor",
    "Storage Account Contributor",
    "Storage Blob Data Contributor",
    "Storage File Data SMB Share Contributor",
    "Storage Queue Data Contributor",
    "Storage Table Data Contributor",
    "API Management Service Contributor",
  ]
  resource_groups = {}
}

environment_ci_roles = {
  subscription = [
    "Reader",
    "PagoPA IaC Reader",
    "DocumentDB Account Contributor", # remove after services collection migration from io-p-cosmos-api
  ]
  resource_groups = {
    terraform-state-rg = [
      "Storage Blob Data Contributor",
    ],
    io-p-services-cms-rg = [
      "Reader and Data Access",
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

github_repository_environment_app_cd = {
  protected_branches     = false
  custom_branch_policies = true
  reviewers_teams        = ["io-platform-green-unit"]
}

environment_app_cd_roles = {
  subscription = []
  resource_groups = {
    io-p-services-cms-rg = [
      "Website Contributor",
    ]
  }
}
