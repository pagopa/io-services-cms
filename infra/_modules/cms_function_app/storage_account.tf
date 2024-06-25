resource "azurerm_storage_queue" "request-review" {
  name                 = "request-review"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-review-poison" {
  name                 = "request-review-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-publication" {
  name                 = "request-publication"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-publication-poison" {
  name                 = "request-publication-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-historicization" {
  name                 = "request-historicization"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-historicization-poison" {
  name                 = "request-historicization-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy" {
  name                 = "request-sync-legacy"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-legacy-poison" {
  name                 = "request-sync-legacy-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms" {
  name                 = "request-sync-cms"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-sync-cms-poison" {
  name                 = "request-sync-cms-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-review-legacy" {
  name                 = "request-review-legacy"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-review-legacy-poison" {
  name                 = "request-review-legacy-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-validation" {
  name                 = "request-validation"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-validation-poison" {
  name                 = "request-validation-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-deletion" {
  name                 = "request-deletion"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-deletion-poison" {
  name                 = "request-deletion-poison"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-detail" {
  name                 = "request-detail"
  storage_account_name = module.cms_fn.storage_account.name
}

resource "azurerm_storage_queue" "request-detail-poison" {
  name                 = "request-detail-poison"
  storage_account_name = module.cms_fn.storage_account.name
}
