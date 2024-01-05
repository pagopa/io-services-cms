module "opex_identity_ci" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "ci"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_opex_ci.environment
    }
  ]

  ci_rbac_roles = {
    subscription_roles = var.opex_environment_ci_roles.subscription
    resource_groups    = var.opex_environment_ci_roles.resource_groups
  }

  tags = var.tags
}

module "opex_identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "cd"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_opex_cd.environment
    }
  ]

  cd_rbac_roles = {
    subscription_roles = var.opex_environment_cd_roles.subscription
    resource_groups    = var.opex_environment_cd_roles.resource_groups
  }

  tags = var.tags
}

module "infra_identity_ci" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "infra"

  identity_role = "ci"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_infra_ci.environment
    }
  ]

  ci_rbac_roles = {
    subscription_roles = var.infra_environment_ci_roles.subscription
    resource_groups    = var.infra_environment_ci_roles.resource_groups
  }

  tags = var.tags
}

module "infra_identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "infra"

  identity_role = "cd"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_infra_cd.environment
    }
  ]

  cd_rbac_roles = {
    subscription_roles = var.infra_environment_cd_roles.subscription
    resource_groups    = var.infra_environment_cd_roles.resource_groups
  }

  tags = var.tags
}

module "identity_ci" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain

  identity_role = "ci"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_ci.environment
    }
  ]

  ci_rbac_roles = {
    subscription_roles = var.environment_ci_roles.subscription
    resource_groups    = var.environment_ci_roles.resource_groups
  }

  tags = var.tags
}

module "identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.35.1"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain

  identity_role = "cd"

  github_federations = [
    {
      repository = "io-services-cms"
      subject    = github_repository_environment.github_repository_environment_cd.environment
    }
  ]

  cd_rbac_roles = {
    subscription_roles = var.environment_cd_roles.subscription
    resource_groups    = var.environment_cd_roles.resource_groups
  }

  tags = var.tags
}
