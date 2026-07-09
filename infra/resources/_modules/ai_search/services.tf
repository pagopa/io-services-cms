########################################################################
# ACTIVE — idx-services-03 pipeline (age filter support)
#
# New AI Search pipeline that adds the filterable ageMin/ageMax fields.
# The "services" alias still points to idx-services-02 (see LEGACY section
# at the bottom of this file); the cutover to idx-services-03 is a future
# step. Keep both pipelines running until the alias switch is validated.
########################################################################

resource "restapi_object" "services_publication_datasource_02" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-services-publication-02",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${local.cosmos_database_name};IdentityAuthType=AccessToken;" },
      container = {
        name  = "services-publication"
        query = "SELECT c.id, c.data.name, c.data.organization.fiscal_code as orgFiscalCode, c._ts, STRINGEQUALS(c.fsm.state, \"unpublished\") ? \"deleted\" : c.fsm.state as state, IS_DEFINED(c.data.age.min) ? c.data.age.min : 18 as ageMin, IS_DEFINED(c.data.age.max) ? c.data.age.max : 999 as ageMax FROM c WHERE c._ts >= @HighWaterMark ORDER BY c._ts"
      },
      dataChangeDetectionPolicy = {
        "@odata.type"           = "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        highWaterMarkColumnName = "_ts"
      },
      dataDeletionDetectionPolicy = {
        "@odata.type" : "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        softDeleteColumnName  = "state",
        softDeleteMarkerValue = "deleted"
      }
  })
  force_new    = ["name"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_lifecycle_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-services-lifecycle-01",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${local.cosmos_database_name};IdentityAuthType=AccessToken;" },
      container = {
        name  = "services-lifecycle"
        query = "SELECT c.id, c._ts, c.fsm.state FROM c WHERE c._ts >= @HighWaterMark and c.fsm.state = \"deleted\" ORDER BY c._ts"
      },
      dataChangeDetectionPolicy = {
        "@odata.type"           = "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        highWaterMarkColumnName = "_ts"
      },
      dataDeletionDetectionPolicy = {
        "@odata.type" : "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        softDeleteColumnName  = "state",
        softDeleteMarkerValue = "deleted"
      }
  })
  force_new    = ["name"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_index_03" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "idx-services-03"
    defaultScoringProfile = null
    fields = [
      {
        name                = "id"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = true
        sortable            = false
        facetable           = false
        key                 = true
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "name"
        type                = "Edm.String"
        searchable          = false
        filterable          = false
        retrievable         = true
        sortable            = true
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "orgFiscalCode"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = false
        sortable            = false
        facetable           = false
        key                 = false
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "version"
        type                = "Edm.Int32"
        searchable          = false
        filterable          = false
        retrievable         = true
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "ageMin"
        type                = "Edm.Int32"
        searchable          = false
        filterable          = true
        retrievable         = false
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "ageMax"
        type                = "Edm.Int32"
        searchable          = false
        filterable          = true
        retrievable         = false
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      }
    ]
    scoringProfiles = []
    corsOptions     = null
    suggesters      = []
    analyzers       = []
    tokenizers      = []
    tokenFilters    = []
    charFilters     = []
    encryptionKey   = null
    similarity = {
      "@odata.type" = "#Microsoft.Azure.Search.BM25Similarity"
      k1            = null
      b             = null
    }
    semantic     = null
    vectorSearch = null
    }
  )
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_publication_indexer_03" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-publication-03"
      dataSourceName  = restapi_object.services_publication_datasource_02.id
      targetIndexName = restapi_object.services_index_03.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = { interval = local.indexers_scheduling_interval.services_publication }
      parameters = {
        batchSize              = null
        maxFailedItems         = null
        maxFailedItemsPerBatch = null
        base64EncodeKeys       = null
        configuration          = {}
      }
      fieldMappings = [
        {
          sourceFieldName = "_ts"
          targetFieldName = "version"
          mappingFunction = null
        }
      ]
      outputFieldMappings = []
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.services_publication_datasource_02]
}

resource "restapi_object" "services_lifecycle_indexer_03" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-lifecycle-03"
      dataSourceName  = restapi_object.services_lifecycle_datasource.id
      targetIndexName = restapi_object.services_index_03.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = { interval = local.indexers_scheduling_interval.services_lifecycle }
      parameters = {
        batchSize              = null
        maxFailedItems         = null
        maxFailedItemsPerBatch = null
        base64EncodeKeys       = null
        configuration          = {}
      }
      fieldMappings       = []
      outputFieldMappings = []
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.services_lifecycle_datasource]
}

resource "restapi_object" "services_alias" {
  path         = "/aliases"
  query_string = "api-version=2024-03-01-Preview"
  data = jsonencode(
    {
      name    = local.index_aliases.services
      indexes = [restapi_object.services_index_02.id]
    }
  )
  force_new    = ["indexes"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.organizations_datasource]
}

########################################################################
# LEGACY — idx-services-02 pipeline
#
# Superseded by the idx-services-03 pipeline above. Kept live for the
# roll-back window: the "services" alias still points to idx-services-02.
# REMOVE this whole block after the alias cutover to idx-services-03 has
# been validated in production.
########################################################################

resource "restapi_object" "services_publication_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-services-publication-01",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${local.cosmos_database_name};IdentityAuthType=AccessToken;" },
      container = {
        name  = "services-publication"
        query = "SELECT c.id, c.data.name, c.data.organization.fiscal_code as orgFiscalCode, c._ts, STRINGEQUALS(c.fsm.state, \"unpublished\") ? \"deleted\" : c.fsm.state as state FROM c WHERE c._ts >= @HighWaterMark ORDER BY c._ts"
      },
      dataChangeDetectionPolicy = {
        "@odata.type"           = "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        highWaterMarkColumnName = "_ts"
      },
      dataDeletionDetectionPolicy = {
        "@odata.type" : "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        softDeleteColumnName  = "state",
        softDeleteMarkerValue = "deleted"
      }
  })
  force_new    = ["name"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_index_02" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "idx-services-02"
    defaultScoringProfile = null
    fields = [
      {
        name                = "id"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = true
        sortable            = false
        facetable           = false
        key                 = true
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "name"
        type                = "Edm.String"
        searchable          = false
        filterable          = false
        retrievable         = true
        sortable            = true
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "orgFiscalCode"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = false
        sortable            = false
        facetable           = false
        key                 = false
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "version"
        type                = "Edm.Int32"
        searchable          = false
        filterable          = false
        retrievable         = true
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      }
    ]
    scoringProfiles = []
    corsOptions     = null
    suggesters      = []
    analyzers       = []
    tokenizers      = []
    tokenFilters    = []
    charFilters     = []
    encryptionKey   = null
    similarity = {
      "@odata.type" = "#Microsoft.Azure.Search.BM25Similarity"
      k1            = null
      b             = null
    }
    semantic     = null
    vectorSearch = null
    }
  )
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_publication_indexer_02" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-publication-02"
      dataSourceName  = restapi_object.services_publication_datasource.id
      targetIndexName = restapi_object.services_index_02.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = { interval = local.indexers_scheduling_interval.services_publication }
      parameters = {
        batchSize              = null
        maxFailedItems         = null
        maxFailedItemsPerBatch = null
        base64EncodeKeys       = null
        configuration          = {}
      }
      fieldMappings = [
        {
          sourceFieldName = "_ts"
          targetFieldName = "version"
          mappingFunction = null
        }
      ]
      outputFieldMappings = []
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.services_publication_datasource]
}

resource "restapi_object" "services_lifecycle_indexer_02" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-lifecycle-02"
      dataSourceName  = restapi_object.services_lifecycle_datasource.id
      targetIndexName = restapi_object.services_index_02.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = { interval = local.indexers_scheduling_interval.services_lifecycle }
      parameters = {
        batchSize              = null
        maxFailedItems         = null
        maxFailedItemsPerBatch = null
        base64EncodeKeys       = null
        configuration          = {}
      }
      fieldMappings       = []
      outputFieldMappings = []
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.services_lifecycle_datasource]
}
