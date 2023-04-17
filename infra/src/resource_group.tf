resource "azurerm_resource_group" "rg" {
  name     = "${local.project}-${var.application_basename}-rg"
  location = var.location

  tags = var.tags
}
