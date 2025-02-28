# backoffice

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
| <a name="module_backoffice"></a> [backoffice](#module\_backoffice) | pagopa/dx-azure-app-service/azurerm | ~> 0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_monitor_autoscale_setting.backoffice](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_autoscale_setting) | resource |
| [azurerm_api_management.apim_itn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management) | data source |
| [azurerm_api_management.apim_v2](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management) | data source |
| [azurerm_api_management_product.apim_itn_product_services](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management_product) | data source |
| [azurerm_api_management_product.apim_v2_product_services](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/api_management_product) | data source |
| [azurerm_application_insights.ai_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/application_insights) | data source |
| [azurerm_client_config.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/client_config) | data source |
| [azurerm_cosmosdb_account.cosmos](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_cosmosdb_account.cosmos_legacy](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/cosmosdb_account) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_client_id](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.azure_client_secret_credential_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.bo_auth_session_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.legacy_cosmosdb_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.selfcare_api_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_key_vault_secret.subscription_migration_api_key](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret) | data source |
| [azurerm_monitor_action_group.error_action_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_action_group) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_azure_client_secret_credential_client_id_name"></a> [azure\_client\_secret\_credential\_client\_id\_name](#input\_azure\_client\_secret\_credential\_client\_id\_name) | Azure Client Secret Credential Client Id Name | `string` | n/a | yes |
| <a name="input_azure_client_secret_credential_secret_name"></a> [azure\_client\_secret\_credential\_secret\_name](#input\_azure\_client\_secret\_credential\_secret\_name) | Azure Client Secret Credential Secret Name | `string` | n/a | yes |
| <a name="input_bo_auth_session_secret_name"></a> [bo\_auth\_session\_secret\_name](#input\_bo\_auth\_session\_secret\_name) | Backoffice Auth Session Secret Name | `string` | n/a | yes |
| <a name="input_bo_snet_cidr"></a> [bo\_snet\_cidr](#input\_bo\_snet\_cidr) | Backoffice Subnet CIDR | `string` | n/a | yes |
| <a name="input_cms_fn_default_hostname"></a> [cms\_fn\_default\_hostname](#input\_cms\_fn\_default\_hostname) | Service CMS Function App Default Hostname Property | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain name of the application | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_key_vault_id"></a> [key\_vault\_id](#input\_key\_vault\_id) | Azure KeyVault ID | `string` | n/a | yes |
| <a name="input_legacy_cosmosdb_key_name"></a> [legacy\_cosmosdb\_key\_name](#input\_legacy\_cosmosdb\_key\_name) | Legacy CosmosDB Key Name | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_peps_snet_id"></a> [peps\_snet\_id](#input\_peps\_snet\_id) | Id of the subnet which holds private endpoints | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"io"` | no |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for the Function App services | `string` | n/a | yes |
| <a name="input_selfcare_api_key_name"></a> [selfcare\_api\_key\_name](#input\_selfcare\_api\_key\_name) | Selfcare API Key Name | `string` | n/a | yes |
| <a name="input_subscription_migration_api_key_name"></a> [subscription\_migration\_api\_key\_name](#input\_subscription\_migration\_api\_key\_name) | Subscription Migration API Key Name | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
