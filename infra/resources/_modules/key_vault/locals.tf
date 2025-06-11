locals {
  key_vault = {
    secrets_name = {
      asset_storage_connectionstring_secret            = "ASSET-STORAGE-CONNECTIONSTRING-SECRET"
      azure_client_secret_credential_secret            = "AZURE-CLIENT-SECRET-CREDENTIAL-SECRET"
      azure_client_secret_credential_client_id         = "AZURE-CLIENT-SECRET-CREDENTIAL-CLIENT-ID"
      bo_auth_session_secret                           = "bo-auth-session-secret"
      jira_token                                       = "JIRA-TOKEN"
      legacy_cosmosdb_connectionstring                 = "legacy-cosmosdb-connectionstring"
      legacy_cosmosdb_key                              = "legacy-cosmosdb-key"
      pgres_flex_admin_pwd                             = "pgres-flex-admin-pwd"
      pgres_flex_readonly_usr_pwd                      = "pgres-flex-readonly-usr-pwd"
      pgres_flex_reviewer_usr_pwd                      = "pgres-flex-reviewer-usr-pwd"
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
