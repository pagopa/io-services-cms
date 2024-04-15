data "azurerm_key_vault" "key_vault_common" {
  name                = var.key_vault_common.name
  resource_group_name = var.key_vault_common.resource_group_name
}

data "azurerm_container_app_environment" "container_app_environment_runner" {
  name                = var.container_app_environment.name
  resource_group_name = var.container_app_environment.resource_group_name
}

module "container_app_job" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//container_app_job_gh_runner?ref=v7.77.0"

  location  = var.location
  prefix    = var.prefix
  env_short = var.env_short

  key_vault = {
    resource_group_name = data.azurerm_key_vault.key_vault_common.resource_group_name
    name                = data.azurerm_key_vault.key_vault_common.name
    secret_name         = var.key_vault_common.pat_secret_name
  }

  environment = {
    name                = data.azurerm_container_app_environment.container_app_environment_runner.name
    resource_group_name = data.azurerm_container_app_environment.container_app_environment_runner.resource_group_name
  }

  job = {
    name = "services-cms"
    repo = "io-services-cms"
  }

  tags = var.tags
}
