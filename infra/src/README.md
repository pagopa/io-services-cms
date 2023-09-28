<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_azuread"></a> [azuread](#requirement\_azuread) | 2.33.0 |
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | 3.42.0 |
| <a name="requirement_tls"></a> [tls](#requirement\_tls) | <= 3.4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azuread"></a> [azuread](#provider\_azuread) | 2.33.0 |
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 3.42.0 |
| <a name="provider_random"></a> [random](#provider\_random) | 3.5.1 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_api_services_cms"></a> [api\_services\_cms](#module\_api\_services\_cms) | git::https://github.com/pagopa/terraform-azurerm-v3.git//api_management_api | v6.20.0 |
| <a name="module_api_services_cms_v2"></a> [api\_services\_cms\_v2](#module\_api\_services\_cms\_v2) | git::https://github.com/pagopa/terraform-azurerm-v3.git//api_management_api | v6.20.0 |
| <a name="module_app_snet"></a> [app\_snet](#module\_app\_snet) | git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet | v6.19.1 |
| <a name="module_backoffice_app"></a> [backoffice\_app](#module\_backoffice\_app) | git::https://github.com/pagopa/terraform-azurerm-v3.git//app_service | v6.20.2 |
| <a name="module_backoffice_app_snet"></a> [backoffice\_app\_snet](#module\_backoffice\_app\_snet) | git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet | v6.20.2 |
| <a name="module_cosmosdb_account"></a> [cosmosdb\_account](#module\_cosmosdb\_account) | git::https://github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_account | v6.19.1 |
| <a name="module_db_cms_containers"></a> [db\_cms\_containers](#module\_db\_cms\_containers) | git::https://github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_sql_container | v6.19.1 |
| <a name="module_key_vault_domain"></a> [key\_vault\_domain](#module\_key\_vault\_domain) | git::https://github.com/pagopa/terraform-azurerm-v3.git//key_vault | v6.19.1 |
| <a name="module_postgres_flexible_server_private"></a> [postgres\_flexible\_server\_private](#module\_postgres\_flexible\_server\_private) | git::https://github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server | v6.19.1 |
| <a name="module_postgres_flexible_snet"></a> [postgres\_flexible\_snet](#module\_postgres\_flexible\_snet) | git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet | v6.19.1 |
| <a name="module_storage_account"></a> [storage\_account](#module\_storage\_account) | git::https://github.com/pagopa/terraform-azurerm-v3.git//storage_account | v6.19.1 |
| <a name="module_webapp_functions_app"></a> [webapp\_functions\_app](#module\_webapp\_functions\_app) | git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app | v6.20.0 |
| <a name="module_webapp_functions_app_staging_slot"></a> [webapp\_functions\_app\_staging\_slot](#module\_webapp\_functions\_app\_staging\_slot) | git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app_slot | v6.20.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_api_management_api_operation_policy.create_service_policy](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_api_operation_policy.create_service_policy_v2](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_api_operation_policy.update_service_logo_policy](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_api_operation_policy.update_service_logo_policy_v2](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_named_value.io_fn_services_cms_key](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_named_value) | resource |
| [azurerm_api_management_named_value.io_fn_services_cms_key_v2](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/api_management_named_value) | resource |
| [azurerm_cosmosdb_sql_database.db_cms](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/cosmosdb_sql_database) | resource |
| [azurerm_key_vault_access_policy.adgroup_admin](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.adgroup_services_cms](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.github_action_cd](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.github_action_ci](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_secret.bo_auth_session_secret](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_secret) | resource |
| [azurerm_key_vault_secret.pgres_flex_admin_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_secret) | resource |
| [azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/key_vault_secret) | resource |
| [azurerm_monitor_autoscale_setting.webapp_functions_app_autoscale](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/monitor_autoscale_setting) | resource |
| [azurerm_monitor_metric_alert.webapp_functions_app_health_check](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/monitor_metric_alert) | resource |
| [azurerm_postgresql_flexible_server_database.reviewer_database](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/postgresql_flexible_server_database) | resource |
| [azurerm_resource_group.rg](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/resource_group) | resource |
| [azurerm_storage_queue.request-historicization](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-historicization-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-publication](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-publication-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-legacy](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-legacy-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-cms](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-cms-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-legacy](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-legacy-poison](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/resources/storage_queue) | resource |
| [random_password.bo_auth_session_secret](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.postgres_admin_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.postgres_reviewer_usr_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [azuread_group.adgroup_admin](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_developers](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_externals](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_security](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_services_cms](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_service_principal.github_action_iac_cd](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/service_principal) | data source |
| [azuread_service_principal.github_action_iac_ci](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/service_principal) | data source |
| [azurerm_api_management.apim](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/api_management) | data source |
| [azurerm_api_management.apim_v2](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/api_management) | data source |
| [azurerm_api_management_product.apim_product_services](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/api_management_product) | data source |
| [azurerm_api_management_product.apim_v2_product_services](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/api_management_product) | data source |
| [azurerm_application_insights.application_insights](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/application_insights) | data source |
| [azurerm_client_config.current](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/client_config) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_client_id](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_secret](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.jira_token](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_connectionstring](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_key](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.serviceid_quality_check_exclusion_list](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/key_vault_secret) | data source |
| [azurerm_monitor_action_group.email](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/monitor_action_group) | data source |
| [azurerm_monitor_action_group.error_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/monitor_action_group) | data source |
| [azurerm_monitor_action_group.slack](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/monitor_action_group) | data source |
| [azurerm_private_dns_zone.privatelink_documents_azure_com](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/private_dns_zone) | data source |
| [azurerm_private_dns_zone.privatelink_postgres_database_azure_com](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/private_dns_zone) | data source |
| [azurerm_subnet.apim_snet](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subnet) | data source |
| [azurerm_subnet.apim_v2_snet](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subnet) | data source |
| [azurerm_subnet.appgateway_snet](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subnet) | data source |
| [azurerm_subnet.github_runner_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subnet) | data source |
| [azurerm_subnet.private_endpoints_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subnet) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/3.42.0/docs/data-sources/subscription) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_azure_apim"></a> [azure\_apim](#input\_azure\_apim) | APIM resource name. | `string` | `null` | no |
| <a name="input_azure_apim_product_id"></a> [azure\_apim\_product\_id](#input\_azure\_apim\_product\_id) | APIM Services Product id. | `string` | `null` | no |
| <a name="input_azure_apim_resource_group"></a> [azure\_apim\_resource\_group](#input\_azure\_apim\_resource\_group) | APIM resource group name. | `string` | `null` | no |
| <a name="input_azure_apim_v2"></a> [azure\_apim\_v2](#input\_azure\_apim\_v2) | APIM v2 resource name. | `string` | `null` | no |
| <a name="input_backoffice_app"></a> [backoffice\_app](#input\_backoffice\_app) | Configuration of the io-services-cms-backoffice service | <pre>object({<br>    sku_name = string<br>  })</pre> | n/a | yes |
| <a name="input_bo_auth_session_secret_rotation_id"></a> [bo\_auth\_session\_secret\_rotation\_id](#input\_bo\_auth\_session\_secret\_rotation\_id) | You can renew the backoffice auth session secret by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1695908210722"` | no |
| <a name="input_cosmos_private_endpoint_enabled"></a> [cosmos\_private\_endpoint\_enabled](#input\_cosmos\_private\_endpoint\_enabled) | n/a | `bool` | n/a | yes |
| <a name="input_cosmos_public_network_access_enabled"></a> [cosmos\_public\_network\_access\_enabled](#input\_cosmos\_public\_network\_access\_enabled) | n/a | `bool` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_functions_autoscale_default"></a> [functions\_autoscale\_default](#input\_functions\_autoscale\_default) | The number of instances that are available for scaling if metrics are not available for evaluation. | `number` | `1` | no |
| <a name="input_functions_autoscale_maximum"></a> [functions\_autoscale\_maximum](#input\_functions\_autoscale\_maximum) | The maximum number of instances for this resource. | `number` | `30` | no |
| <a name="input_functions_autoscale_minimum"></a> [functions\_autoscale\_minimum](#input\_functions\_autoscale\_minimum) | The minimum number of instances for this resource. | `number` | `1` | no |
| <a name="input_functions_kind"></a> [functions\_kind](#input\_functions\_kind) | App service plan kind | `string` | `null` | no |
| <a name="input_functions_sku_size"></a> [functions\_sku\_size](#input\_functions\_sku\_size) | App service plan sku size | `string` | `null` | no |
| <a name="input_functions_sku_tier"></a> [functions\_sku\_tier](#input\_functions\_sku\_tier) | App service plan sku tier | `string` | `null` | no |
| <a name="input_io_common"></a> [io\_common](#input\_io\_common) | Name of common resources of IO platform | <pre>object({<br>    resource_group_name = string<br>    # Network<br>    vnet_name            = string<br>    appgateway_snet_name = string<br>    # Monitor<br>    application_insights_name = string<br>    action_group_email_name   = string<br>    action_group_slack_name   = string<br>  })</pre> | n/a | yes |
| <a name="input_jira_contract_custom_field"></a> [jira\_contract\_custom\_field](#input\_jira\_contract\_custom\_field) | n/a | `string` | `null` | no |
| <a name="input_jira_delegate_email_custom_field"></a> [jira\_delegate\_email\_custom\_field](#input\_jira\_delegate\_email\_custom\_field) | n/a | `string` | `null` | no |
| <a name="input_jira_delegate_name_custom_field"></a> [jira\_delegate\_name\_custom\_field](#input\_jira\_delegate\_name\_custom\_field) | n/a | `string` | `null` | no |
| <a name="input_jira_namespace_url"></a> [jira\_namespace\_url](#input\_jira\_namespace\_url) | n/a | `string` | `null` | no |
| <a name="input_jira_organization_cf_custom_field"></a> [jira\_organization\_cf\_custom\_field](#input\_jira\_organization\_cf\_custom\_field) | n/a | `string` | `null` | no |
| <a name="input_jira_organization_name_custom_field"></a> [jira\_organization\_name\_custom\_field](#input\_jira\_organization\_name\_custom\_field) | n/a | `string` | `null` | no |
| <a name="input_jira_project_name"></a> [jira\_project\_name](#input\_jira\_project\_name) | n/a | `string` | `null` | no |
| <a name="input_jira_username"></a> [jira\_username](#input\_jira\_username) | n/a | `string` | `null` | no |
| <a name="input_legacy_cosmosdb_container_services"></a> [legacy\_cosmosdb\_container\_services](#input\_legacy\_cosmosdb\_container\_services) | The collection of the database where legacy data is | `string` | `"services"` | no |
| <a name="input_legacy_cosmosdb_container_services_lease"></a> [legacy\_cosmosdb\_container\_services\_lease](#input\_legacy\_cosmosdb\_container\_services\_lease) | The lease collection that keeps track of our reads to the service collection change feed | `string` | `"services-cms--legacy-watcher-lease"` | no |
| <a name="input_legacy_cosmosdb_name"></a> [legacy\_cosmosdb\_name](#input\_legacy\_cosmosdb\_name) | The name of the database where legacy data is | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_uri"></a> [legacy\_cosmosdb\_uri](#input\_legacy\_cosmosdb\_uri) | The uri of the database where legacy data is | `string` | n/a | yes |
| <a name="input_legacy_jira_project_name"></a> [legacy\_jira\_project\_name](#input\_legacy\_jira\_project\_name) | n/a | `string` | `null` | no |
| <a name="input_legacy_service_watcher_max_items_per_invocation"></a> [legacy\_service\_watcher\_max\_items\_per\_invocation](#input\_legacy\_service\_watcher\_max\_items\_per\_invocation) | Chunck size for the change feed | `number` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | n/a | `string` | `"westeurope"` | no |
| <a name="input_postgres_admin_credentials_rotation_id"></a> [postgres\_admin\_credentials\_rotation\_id](#input\_postgres\_admin\_credentials\_rotation\_id) | You can renew admin credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1682602957131"` | no |
| <a name="input_postgres_reviewer_usr_credentials_rotation_id"></a> [postgres\_reviewer\_usr\_credentials\_rotation\_id](#input\_postgres\_reviewer\_usr\_credentials\_rotation\_id) | You can renew reviewer user credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1682602957131"` | no |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_reviewer_db_name"></a> [reviewer\_db\_name](#input\_reviewer\_db\_name) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_schema"></a> [reviewer\_db\_schema](#input\_reviewer\_db\_schema) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_table"></a> [reviewer\_db\_table](#input\_reviewer\_db\_table) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_user"></a> [reviewer\_db\_user](#input\_reviewer\_db\_user) | n/a | `string` | `null` | no |
| <a name="input_subnets_cidrs"></a> [subnets\_cidrs](#input\_subnets\_cidrs) | The CIDR address prefixes of the subnets | <pre>object({<br>    api        = list(string)<br>    postgres   = list(string)<br>    backoffice = list(string)<br>  })</pre> | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(any)` | <pre>{<br>  "CreatedBy": "Terraform"<br>}</pre> | no |
| <a name="input_userid_automatic_service_approval_inclusion_list"></a> [userid\_automatic\_service\_approval\_inclusion\_list](#input\_userid\_automatic\_service\_approval\_inclusion\_list) | User Ids allowed to automatic service approval | `string` | n/a | yes |
| <a name="input_userid_cms_to_legacy_sync_inclusion_list"></a> [userid\_cms\_to\_legacy\_sync\_inclusion\_list](#input\_userid\_cms\_to\_legacy\_sync\_inclusion\_list) | User Ids to include in the sync from CMS to legacy | `string` | n/a | yes |
| <a name="input_userid_legacy_to_cms_sync_inclusion_list"></a> [userid\_legacy\_to\_cms\_sync\_inclusion\_list](#input\_userid\_legacy\_to\_cms\_sync\_inclusion\_list) | User Ids to include in the sync from legacy to CMS | `string` | n/a | yes |
| <a name="input_userid_request_review_legacy_inclusion_list"></a> [userid\_request\_review\_legacy\_inclusion\_list](#input\_userid\_request\_review\_legacy\_inclusion\_list) | User Ids to include in the request review from legacy services | `string` | n/a | yes |

## Outputs

No outputs.
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
