locals {
  repo_secrets = {
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }

  opex_env_ci_secrets = {
    "ARM_CLIENT_ID" = module.opex_identity_ci.identity_client_id
  }

  opex_env_cd_secrets = {
    "ARM_CLIENT_ID" = module.opex_identity_cd.identity_client_id
  }

  env_ci_secrets = {
    "ARM_CLIENT_ID" = module.infra_identity_ci.identity_client_id
  }

  env_cd_secrets = {
    "ARM_CLIENT_ID" = module.infra_identity_cd.identity_client_id
  }

  app_env_ci_secrets = {
    "ARM_CLIENT_ID" = module.identity_ci.identity_client_id
  }

  app_env_cd_secrets = {
    "ARM_CLIENT_ID" = module.identity_cd.identity_client_id
  }
}
