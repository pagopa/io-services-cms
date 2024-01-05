locals {
  app_name = "github-${var.github.org}-${var.github.repository}-${var.env}"

  environment_app_cd_resource_group_roles = distinct(flatten([
    for rg, role_list in var.environment_app_cd_roles.resource_groups : [
      for role in role_list : {
        resource_group = rg
        role           = role
      }
    ]
  ]))

  environment_cd_resource_group_roles = distinct(flatten([
    for rg, role_list in var.environment_cd_roles.resource_groups : [
      for role in role_list : {
        resource_group = rg
        role           = role
      }
    ]
  ]))

  environment_ci_resource_group_roles = distinct(flatten([
    for rg, role_list in var.environment_ci_roles.resource_groups : [
      for role in role_list : {
        resource_group = rg
        role           = role
      }
    ]
  ]))

  repo_secrets = {
    "AZURE_SUBSCRIPTION_ID" = data.azurerm_client_config.current.subscription_id
    "AZURE_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }

  opex_env_ci_secrets = {
    "AZURE_CLIENT_ID_CI" = module.opex_identity_ci.identity_client_id
  }

  opex_env_cd_secrets = {
    "AZURE_CLIENT_ID_CD" = module.opex_identity_cd.identity_client_id
  }

  infra_env_ci_secrets = {
    "AZURE_CLIENT_ID_CI" = module.infra_identity_ci.identity_client_id
  }

  infra_env_cd_secrets = {
    "AZURE_CLIENT_ID_CD" = module.infra_identity_cd.identity_client_id
  }

  env_ci_secrets = {
    "AZURE_CLIENT_ID_CI" = module.identity_ci.identity_client_id
  }

  env_cd_secrets = {
    "AZURE_CLIENT_ID_CD" = module.identity_cd.identity_client_id
  }
}
