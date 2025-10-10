module "storage_account" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "app-be"
    instance_number = "01"
  }
  resource_group_name = var.resource_group_name
  use_case            = "default"
  subnet_pep_id       = var.peps_snet_id

  subservices_enabled = {
    blob = true
  }

  blob_features = {
    versioning = true
  }

  containers = [{
    name = "static-content" // TODO: refactor with a local variable
  }]

  action_group_id = var.error_action_group_id

  tags = var.tags
}

# resource "azurerm_storage_blob" "featured_services" {
#   name                   = "featured-services.json"
#   storage_account_name   = module.storage_account.name
#   storage_container_name = "static-content"
#   type                   = "Block"
#   source                 = "${path.module}/featured-services.json"
#   content_type           = "application/json"
#   content_md5            = filemd5("${path.module}/featured-services.json")
# }

# resource "azurerm_storage_blob" "featured_institutions" {
#   name                   = "featured-institutions.json"
#   storage_account_name   = module.storage_account.name
#   storage_container_name = "static-content"
#   type                   = "Block"
#   source                 = "${path.module}/featured-institutions.json"
#   content_type           = "application/json"
#   content_md5            = filemd5("${path.module}/featured-institutions.json")
# }


resource "azurerm_storage_container" "static_content" {
  name                  = "static-content"
  storage_account_id    = module.app_be_fn.storage_account.id
  container_access_type = "private"
}

resource "azurerm_storage_blob" "featured_services" {
  name                   = "featured-services.json"
  storage_account_name   = module.app_be_fn.storage_account.name
  storage_container_name = azurerm_storage_container.static_content.name
  type                   = "Block"
  source                 = "${path.module}/featured-services.json"
  content_type           = "application/json"
  content_md5            = filemd5("${path.module}/featured-services.json")
}

resource "azurerm_storage_blob" "featured_institutions" {
  name                   = "featured-institutions.json"
  storage_account_name   = module.app_be_fn.storage_account.name
  storage_container_name = azurerm_storage_container.static_content.name
  type                   = "Block"
  source                 = "${path.module}/featured-institutions.json"
  content_type           = "application/json"
  content_md5            = filemd5("${path.module}/featured-institutions.json")
}
