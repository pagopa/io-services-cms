module "storage_account" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//storage_account?ref=v6.3.0"

  name                          = replace("${local.project}-${local.application_basename}-st", "-", "")
  account_kind                  = "StorageV2"
  account_tier                  = "Standard"
  account_replication_type      = "ZRS"
  access_tier                   = "Hot"
  blob_versioning_enabled       = false
  resource_group_name           = azurerm_resource_group.rg.name
  location                      = var.location
  advanced_threat_protection    = false
  public_network_access_enabled = false

  tags = var.tags
}
