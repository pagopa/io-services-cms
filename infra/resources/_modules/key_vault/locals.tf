locals {
  key_vault = {
    secrets_name = {
      asset_storage_connectionstring_secret            = "ASSET-STORAGE-CONNECTIONSTRING-SECRET"
      jira_token                                       = "JIRA-TOKEN"
      legacy_cosmosdb_connectionstring                 = "legacy-cosmosdb-connectionstring"
      legacy_cosmosdb_key                              = "legacy-cosmosdb-key"
      cms_pgres_admin_pwd                              = "pgres-flex-admin-pwd"
      cms_pgres_reviewer_usr_pwd                       = "pgres-flex-reviewer-usr-pwd"
      selfcare_api_key                                 = "SELFCARE-API-KEY"
      serviceid_quality_check_exclusion_list           = "SERVICEID-QUALITY-CHECK-EXCLUSION-LIST"
      subscription_migration_api_key                   = "SUBSCRIPTION-MIGRATION-API-KEY"
      services_publication_event_hub_connection_string = "SERVICES-PUBLICATION-EVENT-HUB-CONNECTION-STRING"
      services_topics_event_hub_connection_string      = "SERVICES-TOPICS-EVENT-HUB-CONNECTION-STRING"
      services_lifecycle_event_hub_connection_string   = "SERVICES-LIFECYCLE-EVENT-HUB-CONNECTION-STRING"
      services_history_event_hub_connection_string     = "SERVICES-HISTORY-EVENT-HUB-CONNECTION-STRING"
      activations_event_hub_connection_string          = "ACTIVATIONS-EVENT-HUB-CONNECTION-STRING"
      eh_sc_connectionstring                           = "EH-SC-CONNECTIONSTRING"
      pdv_tokenizer_api_key                            = "PDV-TOKENIZER-API-KEY"
      slack_svc_monitor_email                          = "slack-svc-monitor-email"
      opsgenie_svc_api_key                             = "opsgenie-svc-api-key"
    }
  }
}
