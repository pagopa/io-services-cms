locals {
  repository = {
    name                     = "io-services-cms"
    description              = "The subsystem for Institutions to manage their services into the IO App"
    topics                   = ["services-cms"]
    reviewers_teams          = ["io-platform-green-unit", "engineering-team-cloud-eng"]
    default_branch_name      = "master"
    infra_cd_policy_branches = ["master"]
    opex_cd_policy_branches  = ["master"]
    app_cd_policy_branches   = ["master"]
    app_cd_policy_tags       = ["io-services-app-backend@*", "io-services-cms-backoffice@*", "io-services-cms-webapp@*"]
    jira_boards_ids          = ["CES", "IOPAE"]
  }
}
