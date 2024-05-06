resource "restapi_object" "services_publication_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-services-publication-01",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${var.cosmos_database_name};IdentityAuthType=AccessToken;" },
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

resource "restapi_object" "services_lifecycle_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-services-lifecycle-01",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${var.cosmos_database_name};IdentityAuthType=AccessToken;" },
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

resource "restapi_object" "services_index_01" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "idx-services-01"
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

resource "restapi_object" "services_publication_indexer" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-publication-01"
      dataSourceName  = restapi_object.services_publication_datasource.id
      targetIndexName = restapi_object.services_index_01.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = null
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

resource "restapi_object" "services_lifecycle_indexer" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "idxr-services-lifecycle-01"
      dataSourceName  = restapi_object.services_lifecycle_datasource.id
      targetIndexName = restapi_object.services_index_01.id
      description     = null
      skillsetName    = null
      disabled        = null
      schedule        = null
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
      name    = var.index_aliases.services
      indexes = [restapi_object.services_index_01.id]
    }
  )
  force_new    = ["indexes"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.organizations_datasource]
}
