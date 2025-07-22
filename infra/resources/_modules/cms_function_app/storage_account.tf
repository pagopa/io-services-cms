module "cms_storage_account" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "cms"
    instance_number = "01"
  }
  resource_group_name = var.resource_group_name
  tier                = "l"
  subnet_pep_id       = var.peps_snet_id

  subservices_enabled = {
    blob  = true
    queue = true
  }

  blob_features = {
    versioning = true
  }

  action_group_id = var.error_action_group_id

  tags = var.tags
}


/***************************************
 * Storage Queues for CMS Function App *
 ***************************************/

resource "azurerm_storage_queue" "request-review" {
  name                 = "request-review"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-review-poison" {
  name                 = "request-review-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-publication" {
  name                 = "request-publication"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-publication-poison" {
  name                 = "request-publication-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-historicization" {
  name                 = "request-historicization"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-historicization-poison" {
  name                 = "request-historicization-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy" {
  name                 = "request-sync-legacy"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy-poison" {
  name                 = "request-sync-legacy-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms" {
  name                 = "request-sync-cms"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms-poison" {
  name                 = "request-sync-cms-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-review-legacy" {
  name                 = "request-review-legacy"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-review-legacy-poison" {
  name                 = "request-review-legacy-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-validation" {
  name                 = "request-validation"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-validation-poison" {
  name                 = "request-validation-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-deletion" {
  name                 = "request-deletion"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-deletion-poison" {
  name                 = "request-deletion-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-detail" {
  name                 = "request-detail"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-detail-poison" {
  name                 = "request-detail-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-publication-ingestion-retry" {
  name                 = "request-services-publication-ingestion-retry"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-publication-ingestion-retry-poison" {
  name                 = "request-services-publication-ingestion-retry-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-lifecycle-ingestion-retry" {
  name                 = "request-services-lifecycle-ingestion-retry"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-lifecycle-ingestion-retry-poison" {
  name                 = "request-services-lifecycle-ingestion-retry-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-history-ingestion-retry" {
  name                 = "request-services-history-ingestion-retry"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-history-ingestion-retry-poison" {
  name                 = "request-services-history-ingestion-retry-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "sync-group-poison" {
  name                 = "sync-group-poison"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "sync-activations-from-legacy-poison" {
  name                 = "sync-activations-from-legacy-poison"
  storage_account_name = module.cms_storage_account.name
}


/*******************************************
 * Storage Containers for CMS Function App *
 *******************************************/

resource "azurerm_storage_container" "activations" {
  name                  = "activations"
  storage_account_name  = module.cms_storage_account.name
  container_access_type = "private"
}
