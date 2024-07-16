env       = "prod"
env_short = "p"
prefix    = "io"
domain    = "services-cms"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "io"
  Source      = "https://github.com/pagopa/io-services-cms"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

opex_environment_ci_roles = {
  subscription = ["Reader"]
  resource_groups = {
    dashboards = [
      "Reader"
    ],
    terraform-state-rg = [
      "Storage Blob Data Reader",
      "Reader and Data Access"
    ]
  }
}

opex_environment_cd_roles = {
  subscription = ["Reader"]
  resource_groups = {
    dashboards = [
      "Contributor"
    ],
    terraform-state-rg = [
      "Storage Blob Data Contributor",
      "Reader and Data Access"
    ]
  }
}

infra_environment_ci_roles = {
  subscription = ["Reader"]
  resource_groups = {
    terraform-state-rg = [
      "Storage Blob Data Contributor",
      "Reader and Data Access"
    ],
    io-p-services-cms-rg = [
      "Contributor"
    ],
    io-p-itn-svc-rg-01 = [
      "Contributor",
      "Search Service Contributor",
      "Storage Blob Data Reader",
      "Storage Queue Data Reader",
    ]
  }
}

infra_environment_cd_roles = {
  subscription = ["Contributor"]
  resource_groups = {
    terraform-state-rg = [
      "Storage Blob Data Contributor",
      "Reader and Data Access"
    ],
    io-p-itn-svc-rg-01 = [
      "Search Service Contributor",
      "Role Based Access Control Administrator",
      "Storage Blob Data Contributor",
      "Storage Queue Data Contributor",
    ],
    io-p-services-cms-rg = [
      "Role Based Access Control Administrator"
    ]
  }
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
  resource_groups = {
    terraform-state-rg = [
      "Reader and Data Access"
    ],
    io-p-services-cms-rg = [
      "Website Contributor"
    ]
  }
}

github_repository_environment_ci = {
  protected_branches     = false
  custom_branch_policies = true
}

github_repository_environment_cd = {
  protected_branches     = false
  custom_branch_policies = true
  reviewers_teams        = ["io-platform-green-unit", "engineering-team-cloud-eng"]
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
