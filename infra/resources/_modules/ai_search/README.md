# ai_search

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_restapi"></a> [restapi](#requirement\_restapi) | <= 1.19.1 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azuread"></a> [azuread](#provider\_azuread) | n/a |
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | n/a |
| <a name="provider_restapi"></a> [restapi](#provider\_restapi) | <= 1.19.1 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_srch_snet"></a> [srch\_snet](#module\_srch\_snet) | github.com/pagopa/terraform-azurerm-v3//subnet | v8.19.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_role_assignment) | resource |
| [azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader_db](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_role_assignment) | resource |
| [azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader_db_colls](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_role_assignment) | resource |
| [azurerm_monitor_metric_alert.srch_high_latency](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_metric_alert) | resource |
| [azurerm_monitor_metric_alert.srch_throttled_queries](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_metric_alert) | resource |
| [azurerm_private_endpoint.srch](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_endpoint) | resource |
| [azurerm_role_assignment.admins_group_to_ai_search_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.developers_group_to_ai_search_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.infra_cd_to_ai_search_service_contributor](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.infra_ci_to_ai_search_service_contributor](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.search_to_cosmos_account_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_search_service.srch](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/search_service) | resource |
| [azurerm_search_shared_private_link_service.srch_to_cosmos](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/search_shared_private_link_service) | resource |
| [restapi_object.organizations_alias](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.organizations_datasource](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.organizations_index_01](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.organizations_indexer_01](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_alias](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_index_02](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_lifecycle_datasource](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_lifecycle_indexer_02](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_publication_datasource](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [restapi_object.services_publication_indexer_02](https://registry.terraform.io/providers/Mastercard/restapi/latest/docs/resources/object) | resource |
| [azuread_group.adgroup_admin](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/data-sources/group) | data source |
| [azuread_group.adgroup_developers](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/data-sources/group) | data source |
| [azurerm_cosmosdb_account.cosmos](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_monitor_action_group.error_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_private_dns_zone.privatelink_srch](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/private_dns_zone) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |
| [azurerm_user_assigned_identity.managed_identity_infra_cd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/user_assigned_identity) | data source |
| [azurerm_user_assigned_identity.managed_identity_infra_ci](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/user_assigned_identity) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_application_basename"></a> [application\_basename](#input\_application\_basename) | Name of the application | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_peps_snet_id"></a> [peps\_snet\_id](#input\_peps\_snet\_id) | Id of the subnet which holds private endpoints | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix, short environment and short location | `string` | n/a | yes |
| <a name="input_public_network_access_enabled"></a> [public\_network\_access\_enabled](#input\_public\_network\_access\_enabled) | Specifies whether Public Network Access is allowed for this resource | `bool` | `false` | no |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for the AI Search services | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_search_service_id"></a> [search\_service\_id](#output\_search\_service\_id) | n/a |
| <a name="output_search_service_index_aliases"></a> [search\_service\_index\_aliases](#output\_search\_service\_index\_aliases) | n/a |
| <a name="output_search_service_url"></a> [search\_service\_url](#output\_search\_service\_url) | n/a |
<!-- END_TF_DOCS -->
