#
# Variables
#
variable "functions_kind" {
  type        = string
  description = "App service plan kind"
  default     = null
}

variable "functions_sku_tier" {
  type        = string
  description = "App service plan sku tier"
  default     = null
}

variable "functions_sku_size" {
  type        = string
  description = "App service plan sku size"
  default     = null
}

variable "functions_autoscale_minimum" {
  type        = number
  description = "The minimum number of instances for this resource."
  default     = 1
}

variable "functions_autoscale_maximum" {
  type        = number
  description = "The maximum number of instances for this resource."
  default     = 30
}

variable "functions_autoscale_default" {
  type        = number
  description = "The number of instances that are available for scaling if metrics are not available for evaluation."
  default     = 1
}

#
# Data
#
data "azurerm_key_vault_secret" "jira_token" {
  name         = "JIRA-TOKEN"
  key_vault_id = module.key_vault_domain.id
}

data "azurerm_key_vault_secret" "azure_client_secret_credential_secret" {
  name         = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
  key_vault_id = module.key_vault_domain.id
}

#
# Function app definition
#

locals {
  webapp_functions_app_settings = {
    FUNCTIONS_WORKER_RUNTIME       = "node"
    WEBSITE_VNET_ROUTE_ALL         = "1"
    FUNCTIONS_WORKER_PROCESS_COUNT = "4"
    NODE_ENV                       = "production"

    // Keepalive fields are all optionals
    FETCH_KEEPALIVE_ENABLED             = "true"
    FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
    FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
    FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
    FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
    FETCH_KEEPALIVE_TIMEOUT             = "60000"

    # Source data
    COSMOSDB_CONNECTIONSTRING = format("AccountEndpoint=%s;AccountKey=%s;", module.cosmosdb_account.endpoint, module.cosmosdb_account.primary_key)
    COSMOSDB_NAME             = azurerm_cosmosdb_sql_database.db_cms.name
    COSMOSDB_URI              = module.cosmosdb_account.endpoint
    COSMOSDB_KEY              = module.cosmosdb_account.primary_key

    INTERNAL_STORAGE_CONNECTION_STRING = module.storage_account.primary_connection_string

    # JIRA integration for Service review workflow
    JIRA_NAMESPACE_URL = "https://pagopa.atlassian.net"
    JIRA_PROJECT_NAME = "IES"
    JIRA_TOKEN = data.azurerm_key_vault_secret.jira_token.value
    JIRA_USERNAME  = "github-bot@pagopa.it"
    JIRA_CONTRACT_CUSTOM_FIELD = ""
    JIRA_DELEGATE_EMAIL_CUSTOM_FIELD = "customfield_10084"
    JIRA_DELEGATE_NAME_CUSTOM_FIELD = "customfield_10087"
    JIRA_ORGANIZATION_CF_CUSTOM_FIELD = ""
    JIRA_ORGANIZATION_NAME_CUSTOM_FIELD = "customfield_10088"

    # Apim connection
    AZURE_APIM                    = "io-p-apim-api"
    AZURE_APIM_RESOURCE_GROUP     = "io-p-rg-internal"
    AZURE_SUBSCRIPTION_ID         = data.azurerm_subscription.current.subscription_id
    
    AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID = "bdb26925-f0de-4c7e-915f-26604f9b7baf"
    AZURE_CLIENT_SECRET_CREDENTIAL_SECRET    = data.azurerm_key_vault_secret.azure_client_secret_credential_secret.value
    AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID = data.azurerm_client_config.current.tenant_id

    # PostgreSQL 
    REVIEWER_DB_HOST = module.postgres_flexible_server_private.fqdn
    REVIEWER_DB_NAME = "reviewer"
    REVIEWER_DB_PASSWORD = module.postgres_flexible_server_private.administrator_password
    REVIEWER_DB_PORT = module.postgres_flexible_server_private.connection_port
    REVIEWER_DB_SCHEMA = "reviewer"
    REVIEWER_DB_TABLE = "service_review"
    REVIEWER_DB_USER = module.postgres_flexible_server_private.administrator_login

  }
}

module "webapp_functions_app" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app?ref=v6.3.0"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "${local.project}-${local.application_basename}-webapp-fn"
  location            = var.location
  health_check_path   = "/api/v1/info"

  app_service_plan_info = {
    kind                         = var.functions_kind
    sku_tier                     = var.functions_sku_tier
    sku_size                     = var.functions_sku_size
    maximum_elastic_worker_count = 0
  }

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = local.webapp_functions_app_settings

  subnet_id = module.app_snet.id

  allowed_subnets = [module.app_snet.id]

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  tags = var.tags
}


module "webapp_functions_app_staging_slot" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v6.3.0"

  resource_group_name = azurerm_resource_group.rg.name
  name                = "staging"
  location            = var.location
  health_check_path   = "/api/v1/info"

  function_app_id = module.webapp_functions_app.id

  node_version    = 18
  runtime_version = "~4"

  always_on = "true"

  app_settings = local.webapp_functions_app_settings

  storage_account_name = module.storage_account.name

  subnet_id = module.app_snet.id

  allowed_subnets = [module.app_snet.id]

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "webapp_functions_app_health_check" {
  name                = "${module.webapp_functions_app.name}-health-check-failed"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [module.webapp_functions_app.id]
  description         = "${module.webapp_functions_app.name} health check failed"
  severity            = 1
  frequency           = "PT5M"
  auto_mitigate       = false
  enabled             = false # todo enable after deploy

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HealthCheckStatus"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 50
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.email.id
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.slack.id
  }
}


resource "azurerm_monitor_autoscale_setting" "webapp_functions_app_autoscale" {
  name                = "${module.webapp_functions_app.name}-autoscale"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  target_resource_id  = module.webapp_functions_app.app_service_plan_id

  profile {
    name = "default"

    capacity {
      default = var.functions_autoscale_default
      minimum = var.functions_autoscale_minimum
      maximum = var.functions_autoscale_maximum
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.webapp_functions_app.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 3000
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.webapp_functions_app.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 60
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.webapp_functions_app.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 2000
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT20M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.webapp_functions_app.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 30
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT20M"
      }
    }
  }
}

