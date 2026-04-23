module "ext_storage_account" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = local.app_name
    instance_number = "01"
  }
  resource_group_name = var.resource_group_name
  use_case            = "delegated_access"
  subnet_pep_id       = var.peps_snet_id

  subservices_enabled = {
    blob = true
  }

  containers = values(local.containers)

  action_group_id = var.error_action_group_id

  tags = var.tags
}


/************************************************************
 * Storage Management Policies for External Storage Account *
 ************************************************************/

resource "azurerm_storage_management_policy" "ext_sa_mgmt_policy" {
  storage_account_id = module.ext_storage_account.id

  rule {
    name    = "delete-old-blobs-api-keys"
    enabled = true
    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["api-keys/"]
    }
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 2
      }
    }
  }
}
