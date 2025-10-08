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
}
