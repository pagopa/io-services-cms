#####################
#  Azure AI Search  #
#####################

resource "azurerm_search_service" "srch" {
  name                          = "${var.project}-${var.application_basename}-srch-01"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  public_network_access_enabled = var.public_network_access_enabled

  sku             = local.sku
  replica_count   = local.replica_count
  partition_count = local.partition_count

  identity {
    type = "SystemAssigned"
  }

  local_authentication_enabled = true
  authentication_failure_mode  = "http403"

  tags = var.tags
}
