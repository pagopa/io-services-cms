resource "azuread_application" "environment_app_cd" {
  display_name = "${local.app_name}-app-cd"
}

resource "azuread_service_principal" "environment_app_cd" {
  application_id = azuread_application.environment_app_cd.application_id
}

resource "azuread_application_federated_identity_credential" "environment_app_cd" {
  application_object_id = azuread_application.environment_app_cd.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-app-cd"
}

resource "azurerm_role_assignment" "environment_app_cd_subscription" {
  for_each             = toset(var.environment_app_cd_roles.subscription)
  scope                = data.azurerm_subscription.current.id
  role_definition_name = each.key
  principal_id         = azuread_service_principal.environment_app_cd.object_id
}

resource "azurerm_role_assignment" "environment_app_cd_resource_group" {
  for_each             = { for entry in local.environment_app_cd_resource_group_roles : "${entry.role}.${entry.resource_group}" => entry }
  scope                = data.azurerm_resource_group.environment_app_cd_resource_groups[each.value.resource_group].id
  role_definition_name = each.value.role
  principal_id         = azuread_service_principal.environment_app_cd.object_id
}

output "azure_environment_app_cd" {
  value = {
    app_name       = "${local.app_name}-app-cd"
    client_id      = azuread_service_principal.environment_app_cd.application_id
    application_id = azuread_service_principal.environment_app_cd.application_id
    object_id      = azuread_service_principal.environment_app_cd.object_id
  }
}
