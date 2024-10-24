module "cms_storage_account" {
  source = "github.com/pagopa/terraform-azurerm-v3//storage_account?ref=v8.26.3"

  name                          = "${var.prefix}${var.env_short}${var.location_short}${var.domain}cmsst01"
  account_kind                  = "StorageV2"
  account_tier                  = "Standard"
  account_replication_type      = "ZRS"
  access_tier                   = "Hot"
  blob_versioning_enabled       = false
  resource_group_name           = var.resource_group_name
  location                      = var.location
  advanced_threat_protection    = false
  public_network_access_enabled = false

  action = [{
    action_group_id    = data.azurerm_monitor_action_group.error_action_group.id
    webhook_properties = null
  }]

  tags = var.tags
}

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

resource "azurerm_storage_queue" "request-services-history-ingestion-retry" {
  name                 = "request-services-history-ingestion-retry"
  storage_account_name = module.cms_storage_account.name
}

resource "azurerm_storage_queue" "request-services-history-ingestion-retry-poison" {
  name                 = "request-services-history-ingestion-retry-poison"
  storage_account_name = module.cms_storage_account.name
}