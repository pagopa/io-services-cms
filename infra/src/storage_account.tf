module "storage_account" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//storage_account?ref=v6.19.1"

  name                          = replace("${local.project}-${local.application_basename}-st", "-", "")
  account_kind                  = "StorageV2"
  account_tier                  = "Standard"
  account_replication_type      = "ZRS"
  access_tier                   = "Hot"
  blob_versioning_enabled       = false
  resource_group_name           = azurerm_resource_group.rg.name
  location                      = var.location
  advanced_threat_protection    = false
  public_network_access_enabled = true

  tags = var.tags
}

resource "azurerm_storage_queue" "request-review" {
  name                 = "request-review"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-review-poison" {
  name                 = "request-review-poison"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-publication" {
  name                 = "request-publication"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-publication-poison" {
  name                 = "request-publication-poison"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-historicization" {
  name                 = "request-historicization"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-historicization-poison" {
  name                 = "request-historicization-poison"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy" {
  name                 = "request-sync-legacy"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy-poison" {
  name                 = "request-sync-legacy-poison"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms" {
  name                 = "request-sync-cms"
  storage_account_name = module.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms-poison" {
  name                 = "request-sync-cms-poison"
  storage_account_name = module.storage_account.name
}
