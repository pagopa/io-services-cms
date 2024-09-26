<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_azuread"></a> [azuread](#requirement\_azuread) | 2.33.0 |
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | <= 3.116.0 |
| <a name="requirement_tls"></a> [tls](#requirement\_tls) | <= 3.4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azuread"></a> [azuread](#provider\_azuread) | 2.33.0 |
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 3.116.0 |
| <a name="provider_random"></a> [random](#provider\_random) | 3.6.3 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_api_services_cms_v2"></a> [api\_services\_cms\_v2](#module\_api\_services\_cms\_v2) | github.com/pagopa/terraform-azurerm-v3.git//api_management_api | v8.44.2 |
| <a name="module_app_snet"></a> [app\_snet](#module\_app\_snet) | github.com/pagopa/terraform-azurerm-v3.git//subnet | v8.44.2 |
| <a name="module_container_app_job"></a> [container\_app\_job](#module\_container\_app\_job) | github.com/pagopa/terraform-azurerm-v3.git//container_app_job_gh_runner | v8.44.2 |
| <a name="module_cosmosdb_account"></a> [cosmosdb\_account](#module\_cosmosdb\_account) | github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_account | v8.44.2 |
| <a name="module_db_app_be_containers"></a> [db\_app\_be\_containers](#module\_db\_app\_be\_containers) | github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_sql_container | v8.44.2 |
| <a name="module_db_cms_containers"></a> [db\_cms\_containers](#module\_db\_cms\_containers) | github.com/pagopa/terraform-azurerm-v3.git//cosmosdb_sql_container | v8.44.2 |
| <a name="module_key_vault_domain"></a> [key\_vault\_domain](#module\_key\_vault\_domain) | github.com/pagopa/terraform-azurerm-v3.git//key_vault | v8.44.2 |
| <a name="module_postgres_flexible_server_private"></a> [postgres\_flexible\_server\_private](#module\_postgres\_flexible\_server\_private) | github.com/pagopa/terraform-azurerm-v3.git//postgres_flexible_server | v8.44.2 |
| <a name="module_postgres_flexible_snet"></a> [postgres\_flexible\_snet](#module\_postgres\_flexible\_snet) | github.com/pagopa/terraform-azurerm-v3.git//subnet | v8.44.2 |

## Resources

| Name | Type |
|------|------|
| [azurerm_api_management_api_diagnostic.services_cms_api_app_insights](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_diagnostic) | resource |
| [azurerm_api_management_api_operation_policy.create_service_policy_v2](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_api_operation_policy.get_service_topics_policy_v2](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_operation_policy) | resource |
| [azurerm_api_management_logger.cache_policy_app_insights](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_logger) | resource |
| [azurerm_cosmosdb_sql_database.db_app_be](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_database) | resource |
| [azurerm_cosmosdb_sql_database.db_cms](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_sql_database) | resource |
| [azurerm_key_vault_access_policy.adgroup_admin](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.adgroup_services_cms](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.apim](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_access_policy.github_action](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_access_policy) | resource |
| [azurerm_key_vault_secret.bo_auth_session_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret) | resource |
| [azurerm_key_vault_secret.pgres_flex_admin_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret) | resource |
| [azurerm_key_vault_secret.pgres_flex_readonly_usr_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret) | resource |
| [azurerm_key_vault_secret.pgres_flex_reviewer_usr_pwd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret) | resource |
| [azurerm_postgresql_flexible_server_database.reviewer_database](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/postgresql_flexible_server_database) | resource |
| [azurerm_private_endpoint.cosmos_db](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_endpoint) | resource |
| [azurerm_resource_group.rg](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group) | resource |
| [random_password.bo_auth_session_secret](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.postgres_admin_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.postgres_readonly_usr_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.postgres_reviewer_usr_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [azuread_group.adgroup_admin](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_developers](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_externals](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_security](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.adgroup_services_cms](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azuread_group.github_action_iac](https://registry.terraform.io/providers/hashicorp/azuread/2.33.0/docs/data-sources/group) | data source |
| [azurerm_api_management.apim_v2](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management) | data source |
| [azurerm_api_management_product.apim_v2_product_services](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management_product) | data source |
| [azurerm_application_insights.application_insights](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/application_insights) | data source |
| [azurerm_client_config.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/client_config) | data source |
| [azurerm_container_app_environment.container_app_environment_runner](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/container_app_environment) | data source |
| [azurerm_cosmosdb_account.cosmos_legacy](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_key_vault.key_vault_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault) | data source |
| [azurerm_key_vault_secret.asset_storage_connectionstring_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_client_id](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.function_apim_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.jira_token](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_connectionstring](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.selfcare_api_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.serviceid_quality_check_exclusion_list](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.subscription_migration_api_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_linux_function_app.itn_webapp_functions_app](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/linux_function_app) | data source |
| [azurerm_monitor_action_group.email](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_monitor_action_group.error_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_monitor_action_group.iopquarantineerror_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_monitor_action_group.slack](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_private_dns_zone.privatelink_documents_azure_com](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/private_dns_zone) | data source |
| [azurerm_private_dns_zone.privatelink_postgres_database_azure_com](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/private_dns_zone) | data source |
| [azurerm_subnet.apim_v2_snet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subnet.appgateway_snet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subnet.devportal_snet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subnet.github_runner_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subnet.private_endpoints_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subnet.private_endpoints_subnet_itn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subnet) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_azure_apim_product_id"></a> [azure\_apim\_product\_id](#input\_azure\_apim\_product\_id) | APIM Services Product id. | `string` | `null` | no |
| <a name="input_azure_apim_resource_group"></a> [azure\_apim\_resource\_group](#input\_azure\_apim\_resource\_group) | APIM resource group name. | `string` | `null` | no |
| <a name="input_azure_apim_v2"></a> [azure\_apim\_v2](#input\_azure\_apim\_v2) | APIM v2 resource name. | `string` | `null` | no |
| <a name="input_bo_auth_session_secret_rotation_id"></a> [bo\_auth\_session\_secret\_rotation\_id](#input\_bo\_auth\_session\_secret\_rotation\_id) | You can renew the backoffice auth session secret by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1695908210722"` | no |
| <a name="input_container_app_environment"></a> [container\_app\_environment](#input\_container\_app\_environment) | n/a | <pre>object({<br>    name                = string<br>    resource_group_name = string<br>  })</pre> | n/a | yes |
| <a name="input_cosmos_private_endpoint_enabled"></a> [cosmos\_private\_endpoint\_enabled](#input\_cosmos\_private\_endpoint\_enabled) | n/a | `bool` | n/a | yes |
| <a name="input_cosmos_public_network_access_enabled"></a> [cosmos\_public\_network\_access\_enabled](#input\_cosmos\_public\_network\_access\_enabled) | n/a | `bool` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_io_common"></a> [io\_common](#input\_io\_common) | Name of common resources of IO platform | <pre>object({<br>    resource_group_name = string<br>    # Network<br>    vnet_name            = string<br>    appgateway_snet_name = string<br>    # Monitor<br>    application_insights_name = string<br>    action_group_email_name   = string<br>    action_group_slack_name   = string<br>  })</pre> | n/a | yes |
| <a name="input_key_vault_common"></a> [key\_vault\_common](#input\_key\_vault\_common) | n/a | <pre>object({<br>    resource_group_name = string<br>    name                = string<br>    pat_secret_name     = string<br>  })</pre> | n/a | yes |
| <a name="input_legacy_cosmosdb_container_services"></a> [legacy\_cosmosdb\_container\_services](#input\_legacy\_cosmosdb\_container\_services) | The collection of the database where legacy data is | `string` | `"services"` | no |
| <a name="input_legacy_cosmosdb_container_services_lease"></a> [legacy\_cosmosdb\_container\_services\_lease](#input\_legacy\_cosmosdb\_container\_services\_lease) | The lease collection that keeps track of our reads to the service collection change feed | `string` | `"services-cms--legacy-watcher-lease"` | no |
| <a name="input_legacy_cosmosdb_name"></a> [legacy\_cosmosdb\_name](#input\_legacy\_cosmosdb\_name) | The name of the database where legacy data is | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_resource_group"></a> [legacy\_cosmosdb\_resource\_group](#input\_legacy\_cosmosdb\_resource\_group) | The name of the resource group where legacy data is | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_resource_name"></a> [legacy\_cosmosdb\_resource\_name](#input\_legacy\_cosmosdb\_resource\_name) | The name of the resource where legacy data is | `string` | n/a | yes |
| <a name="input_legacy_service_watcher_max_items_per_invocation"></a> [legacy\_service\_watcher\_max\_items\_per\_invocation](#input\_legacy\_service\_watcher\_max\_items\_per\_invocation) | Chunck size for the change feed | `number` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | n/a | `string` | `"westeurope"` | no |
| <a name="input_postgres_admin_credentials_rotation_id"></a> [postgres\_admin\_credentials\_rotation\_id](#input\_postgres\_admin\_credentials\_rotation\_id) | You can renew admin credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1682602957131"` | no |
| <a name="input_postgres_readonly_usr_credentials_rotation_id"></a> [postgres\_readonly\_usr\_credentials\_rotation\_id](#input\_postgres\_readonly\_usr\_credentials\_rotation\_id) | You can renew readonly user credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1682602957131"` | no |
| <a name="input_postgres_reviewer_usr_credentials_rotation_id"></a> [postgres\_reviewer\_usr\_credentials\_rotation\_id](#input\_postgres\_reviewer\_usr\_credentials\_rotation\_id) | You can renew reviewer user credentials for PostgrsSQL by using a new, never-used-before value (hint: use the current timestamp) | `string` | `"1682602957131"` | no |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_reviewer_db_name"></a> [reviewer\_db\_name](#input\_reviewer\_db\_name) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_schema"></a> [reviewer\_db\_schema](#input\_reviewer\_db\_schema) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_table"></a> [reviewer\_db\_table](#input\_reviewer\_db\_table) | n/a | `string` | `null` | no |
| <a name="input_reviewer_db_user"></a> [reviewer\_db\_user](#input\_reviewer\_db\_user) | n/a | `string` | `null` | no |
| <a name="input_subnets_cidrs"></a> [subnets\_cidrs](#input\_subnets\_cidrs) | The CIDR address prefixes of the subnets | <pre>object({<br>    api        = list(string)<br>    postgres   = list(string)<br>    backoffice = list(string)<br>  })</pre> | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(any)` | <pre>{<br>  "CreatedBy": "Terraform"<br>}</pre> | no |
| <a name="input_topic_db_schema"></a> [topic\_db\_schema](#input\_topic\_db\_schema) | n/a | `string` | `null` | no |
| <a name="input_topic_db_table"></a> [topic\_db\_table](#input\_topic\_db\_table) | n/a | `string` | `null` | no |

## Outputs

No outputs.
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->