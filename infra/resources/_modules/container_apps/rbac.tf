module "ca_key_vault" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.2"

  subscription_id = local.subscription_id
  principal_id    = module.backend_func_itn.principal_id

  key_vault = [
    {
      name                = var.key_vault.name
      resource_group_name = var.key_vault.resource_group_name
      description         = "Allow the Container App to access Key Vault secrets"
      has_rbac_support    = false
      roles = {
        secrets = "owner"
      }
    }
  ]

  cosmos = [
    {
      account_name        = data.azurerm_cosmosdb_account.cosmos.name
      resource_group_name = data.azurerm_cosmosdb_account.cosmos.resource_group_name
      description         = "Allow the Container App to access CosmosDB"
      role                = "reader"
      database            = local.app_be.cosmosdb_name
      collections         = ["services"] // TODO: refactor with a local variable
    }
  ]

  storage_blob = [{
    storage_account_name = "iopitnsvcappbest01" // TODO: refactor with a local variable or with a module output
    resource_group_name  = "io-p-itn-svc-rg-01" // TODO: refactor with a local variable or with a module output
    description          = "Allow Container App to readonly access Blob Storage"
    role                 = "reader"
    container_name       = "static-content" // TODO: refactor with a local variable
    }
  ]
}

resource "azurerm_role_assignment" "app_be_fn_to_ai_search_reader" {
  scope                = var.ai_search.id
  role_definition_name = "Search Index Data Reader"
  principal_id         = module.backend_func_itn.principal_id
}
