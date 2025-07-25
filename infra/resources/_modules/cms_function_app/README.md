# cms_function_app

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
| <a name="module_adf_to_blob_data_reader_db"></a> [adf\_to\_blob\_data\_reader\_db](#module\_adf\_to\_blob\_data\_reader\_db) | pagopa-dx/azure-role-assignments/azurerm | ~> 1.0 |
| <a name="module_cms_fn"></a> [cms\_fn](#module\_cms\_fn) | pagopa-dx/azure-function-app/azurerm | ~> 2.0 |
| <a name="module_cms_storage_account"></a> [cms\_storage\_account](#module\_cms\_storage\_account) | pagopa-dx/azure-storage-account/azurerm | ~> 1.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_monitor_autoscale_setting.cms_fn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_autoscale_setting) | resource |
| [azurerm_monitor_diagnostic_setting.queue_diagnostic_setting](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_diagnostic_setting) | resource |
| [azurerm_monitor_scheduled_query_rules_alert_v2.poison-queue-alert](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_scheduled_query_rules_alert_v2) | resource |
| [azurerm_storage_container.activations](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_container) | resource |
| [azurerm_storage_queue.request-deletion](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-deletion-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-detail](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-detail-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-historicization](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-historicization-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-publication](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-publication-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-legacy](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-legacy-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-review-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-history-ingestion-retry](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-history-ingestion-retry-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-lifecycle-ingestion-retry](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-lifecycle-ingestion-retry-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-publication-ingestion-retry](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-services-publication-ingestion-retry-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-cms](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-cms-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-legacy](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-sync-legacy-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-validation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.request-validation-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.sync-activations-from-legacy-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_storage_queue.sync-group-poison](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_queue) | resource |
| [azurerm_application_insights.ai_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/application_insights) | data source |
| [azurerm_client_config.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/client_config) | data source |
| [azurerm_cosmosdb_account.cosmos](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_cosmosdb_account.cosmos_legacy](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_data_factory.adf](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/data_factory) | data source |
| [azurerm_key_vault_secret.activations_event_hub_connection_string](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.asset_storage_connectionstring_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_client_id](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.eh_sc_connectionstring](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.jira_token](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_connectionstring](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.pdv_tokenizer_api_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.serviceid_quality_check_exclusion_list](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.services_history_event_hub_connection_string](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.services_lifecycle_event_hub_connection_string](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.services_publication_event_hub_connection_string](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.services_topics_event_hub_connection_string](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_postgresql_flexible_server.cms_private_pgflex](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/postgresql_flexible_server) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_activations_event_hub_connection_string_name"></a> [activations\_event\_hub\_connection\_string\_name](#input\_activations\_event\_hub\_connection\_string\_name) | Activations event hub connection string Name | `string` | n/a | yes |
| <a name="input_ai_common_connection_string"></a> [ai\_common\_connection\_string](#input\_ai\_common\_connection\_string) | Application Insights connection string | `string` | n/a | yes |
| <a name="input_asset_storage_connectionstring_secret_name"></a> [asset\_storage\_connectionstring\_secret\_name](#input\_asset\_storage\_connectionstring\_secret\_name) | Asset storage connection string Name | `string` | n/a | yes |
| <a name="input_azure_client_secret_credential_client_id_name"></a> [azure\_client\_secret\_credential\_client\_id\_name](#input\_azure\_client\_secret\_credential\_client\_id\_name) | Azure Client Secret Credential Client Id Name | `string` | n/a | yes |
| <a name="input_azure_client_secret_credential_secret_name"></a> [azure\_client\_secret\_credential\_secret\_name](#input\_azure\_client\_secret\_credential\_secret\_name) | Azure Client Secret Credential Secret Name | `string` | n/a | yes |
| <a name="input_bo_snet_cidr"></a> [bo\_snet\_cidr](#input\_bo\_snet\_cidr) | Backoffice Subnet CIDR | `string` | n/a | yes |
| <a name="input_cms_snet_cidr"></a> [cms\_snet\_cidr](#input\_cms\_snet\_cidr) | CMS Subnet CIDR | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain name of the application | `string` | n/a | yes |
| <a name="input_eh_sc_connectionstring_name"></a> [eh\_sc\_connectionstring\_name](#input\_eh\_sc\_connectionstring\_name) | event hub connection string Name | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_error_action_group_id"></a> [error\_action\_group\_id](#input\_error\_action\_group\_id) | Id of the action group to use for error notifications | `string` | n/a | yes |
| <a name="input_jira_token_name"></a> [jira\_token\_name](#input\_jira\_token\_name) | Connection Token to Jira | `string` | n/a | yes |
| <a name="input_key_vault_id"></a> [key\_vault\_id](#input\_key\_vault\_id) | Azure KeyVault ID | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_connectionstring_name"></a> [legacy\_cosmosdb\_connectionstring\_name](#input\_legacy\_cosmosdb\_connectionstring\_name) | Legacy comsmos db connection string name | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_key_name"></a> [legacy\_cosmosdb\_key\_name](#input\_legacy\_cosmosdb\_key\_name) | Legacy CosmosDB Key Name | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_location_short"></a> [location\_short](#input\_location\_short) | Azure region | `string` | n/a | yes |
| <a name="input_pdv_tokenizer_api_key_name"></a> [pdv\_tokenizer\_api\_key\_name](#input\_pdv\_tokenizer\_api\_key\_name) | PDV token | `string` | n/a | yes |
| <a name="input_peps_snet_id"></a> [peps\_snet\_id](#input\_peps\_snet\_id) | Id of the subnet which holds private endpoints | `string` | n/a | yes |
| <a name="input_pgres_flex_reviewer_usr_pwd_name"></a> [pgres\_flex\_reviewer\_usr\_pwd\_name](#input\_pgres\_flex\_reviewer\_usr\_pwd\_name) | Postgres User Name | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for the Function App services | `string` | n/a | yes |
| <a name="input_serviceid_quality_check_exclusion_list_name"></a> [serviceid\_quality\_check\_exclusion\_list\_name](#input\_serviceid\_quality\_check\_exclusion\_list\_name) | Service quality check exclusion list | `string` | n/a | yes |
| <a name="input_services_history_event_hub_connection_string_name"></a> [services\_history\_event\_hub\_connection\_string\_name](#input\_services\_history\_event\_hub\_connection\_string\_name) | History event hub connection string Name | `string` | n/a | yes |
| <a name="input_services_lifecycle_event_hub_connection_string_name"></a> [services\_lifecycle\_event\_hub\_connection\_string\_name](#input\_services\_lifecycle\_event\_hub\_connection\_string\_name) | Lifecycle event hub connection string Name | `string` | n/a | yes |
| <a name="input_services_publication_event_hub_connection_string_name"></a> [services\_publication\_event\_hub\_connection\_string\_name](#input\_services\_publication\_event\_hub\_connection\_string\_name) | Publication event hub connection string Name | `string` | n/a | yes |
| <a name="input_services_topics_event_hub_connection_string_name"></a> [services\_topics\_event\_hub\_connection\_string\_name](#input\_services\_topics\_event\_hub\_connection\_string\_name) | Topics event hub connection string Name | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cms_fn_default_hostname"></a> [cms\_fn\_default\_hostname](#output\_cms\_fn\_default\_hostname) | n/a |
| <a name="output_cms_fn_name"></a> [cms\_fn\_name](#output\_cms\_fn\_name) | n/a |
| <a name="output_cms_fn_principal_id"></a> [cms\_fn\_principal\_id](#output\_cms\_fn\_principal\_id) | n/a |
<!-- END_TF_DOCS -->
