resource "azurerm_resource_group" "rg" {
  name     = "${local.project}-${local.application_basename}-rg"
  location = var.location

  tags = var.tags
}
