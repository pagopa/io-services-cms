# prod

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_azuread"></a> [azuread](#requirement\_azuread) | 2.48.0 |
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | ~> 4.0 |
| <a name="requirement_dx"></a> [dx](#requirement\_dx) | ~> 0.4 |
| <a name="requirement_restapi"></a> [restapi](#requirement\_restapi) | <= 1.19.1 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 4.38.1 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_ai_search"></a> [ai\_search](#module\_ai\_search) | ../_modules/ai_search | n/a |
| <a name="module_backoffice"></a> [backoffice](#module\_backoffice) | ../_modules/backoffice | n/a |
| <a name="module_cms_function_app"></a> [cms\_function\_app](#module\_cms\_function\_app) | ../_modules/cms_function_app | n/a |
| <a name="module_eventhub"></a> [eventhub](#module\_eventhub) | ../_modules/eventhub | n/a |
| <a name="module_function_app"></a> [function\_app](#module\_function\_app) | ../_modules/function_app | n/a |
| <a name="module_key_vault"></a> [key\_vault](#module\_key\_vault) | ../_modules/key_vault | n/a |
| <a name="module_monitor"></a> [monitor](#module\_monitor) | ../_modules/monitor | n/a |
| <a name="module_postgres"></a> [postgres](#module\_postgres) | ../_modules/postgres | n/a |

## Resources

| Name | Type |
|------|------|
| [azurerm_application_insights.ai_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/application_insights) | data source |
| [azurerm_resource_group.evt-rg](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/resource_group) | data source |
| [azurerm_resource_group.rg](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/resource_group) | data source |
| [azurerm_resource_group.weu-common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/resource_group) | data source |
| [azurerm_subnet.private_endpoints_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_virtual_network.itn_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/virtual_network) | data source |

## Inputs

No inputs.

## Outputs

No outputs.
<!-- END_TF_DOCS -->
