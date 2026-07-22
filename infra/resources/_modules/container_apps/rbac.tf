module "services_app_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.3"

  principal_id    = module.services_ca.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  cosmos = [{
    account_name        = data.azurerm_cosmosdb_account.cosmos.name
    resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
    database            = "db-services-cms"
    collections         = ["services-lifecycle", "services-publication"]
    role                = "writer"
    description         = "Allow services-app to read and write services-lifecycle and services-publication containers"
  }]

  key_vault = [{
    name                = var.cms_key_vault.name
    resource_group_name = var.cms_key_vault.resource_group_name
    description         = "Allow the Container App to access Key Vault secrets"
    has_rbac_support    = false
    roles = {
      secrets = "reader"
    }
  }]
}
