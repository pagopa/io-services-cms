# function_app

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_app_be_fn"></a> [app\_be\_fn](#module\_app\_be\_fn) | pagopa-dx/azure-function-app/azurerm | ~> 0.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_cosmosdb_sql_role_assignment.app_be_fn_staging_slot_to_cosmos_data_reader_db](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_role_assignment) | resource |
| [azurerm_cosmosdb_sql_role_assignment.app_be_fn_to_cosmos_data_reader_db](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_role_assignment) | resource |
| [azurerm_monitor_autoscale_setting.app_be_fn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_autoscale_setting) | resource |
| [azurerm_role_assignment.app_be_fn_staging_slot_to_ai_search_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.app_be_fn_staging_slot_to_cosmos_account_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.app_be_fn_to_ai_search_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.app_be_fn_to_cosmos_account_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_storage_blob.featured_institutions](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_blob) | resource |
| [azurerm_storage_blob.featured_services](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_blob) | resource |
| [azurerm_storage_container.static_content](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_container) | resource |
| [azurerm_application_insights.ai_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/application_insights) | data source |
| [azurerm_cosmosdb_account.cosmos](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_monitor_action_group.error_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_ai_search"></a> [ai\_search](#input\_ai\_search) | AI Search input parameters | <pre>object({<br/>    id                     = string<br/>    url                    = string<br/>    service_version        = string<br/>    institution_index_name = string<br/>    services_index_name    = string<br/>  })</pre> | n/a | yes |
| <a name="input_app_be_snet_cidr"></a> [app\_be\_snet\_cidr](#input\_app\_be\_snet\_cidr) | CMS Subnet CIDR | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain name of the application | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_error_action_group_id"></a> [error\_action\_group\_id](#input\_error\_action\_group\_id) | Id of the action group to use for error notifications | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_peps_snet_id"></a> [peps\_snet\_id](#input\_peps\_snet\_id) | Id of the subnet which holds private endpoints | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for the Function App services | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
