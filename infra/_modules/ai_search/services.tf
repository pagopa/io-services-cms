resource "restapi_object" "services_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "services-cms",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=/subscriptions/${data.azurerm_subscription.current.id}/resourceGroups/${data.azurerm_cosmosdb_account.cosmos.resource_group_name}/providers/Microsoft.DocumentDB/databaseAccounts/${data.azurerm_cosmosdb_account.cosmos.name}/(IdentityAuthType=[AccessToken])" },
      container = {
        name  = "services-publication"
        query = "SELECT c.id, c.data.name, c.data.description, c.data.organization.name as orgName, c.data.organization.fiscal_code as orgFiscalCode, c._ts, c.data.metadata.scope, c.data.metadata, c.data.metadata.topic_id as topicId, STRINGEQUALS(c.fsm.state, \"unpublished\") ? \"deleted\" : c.fsm.state as state FROM c WHERE c._ts >= @HighWaterMark ORDER BY c._ts"
      },
      dataChangeDetectionPolicy = {
        "@odata.type"           = "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        highWaterMarkColumnName = "_ts"
      },
      dataDeletionDetectionPolicy = {
        "@odata.type" : "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        softDeleteColumnName  = "state",
        softDeleteMarkerValue = "deleted"
      },
      #     encryptionKey = {
      #       keyVaultKeyName    = "Name of the Azure Key Vault key used for encryption", # TO SET
      #       keyVaultKeyVersion = "Version of the Azure Key Vault key",
      #       keyVaultUri        = "URI of Azure Key Vault, also referred to as DNS name, that provides the key. An example URI might be https://my-keyvault-name.vault.azure.net",
      #   } 
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "services_index" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "services-full-index"
    defaultScoringProfile = null
    fields = [
      {
        name                = "id"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = true
        stored              = true
        sortable            = false
        facetable           = false
        key                 = true
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        normalizer          = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "name"
        type                = "Edm.String"
        searchable          = true
        filterable          = false
        retrievable         = true
        stored              = true
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = "it.microsoft"
        normalizer          = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "description"
        type                = "Edm.String"
        searchable          = false
        filterable          = false
        retrievable         = true
        stored              = true
        sortable            = false
        facetable           = false
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        normalizer          = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "scope"
        type                = "Edm.String"
        searchable          = false
        filterable          = true
        retrievable         = true
        stored              = true
        sortable            = true
        facetable           = true
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        normalizer          = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "topicId"
        type                = "Edm.Int32"
        searchable          = false
        filterable          = true
        retrievable         = true
        stored              = true
        sortable            = false
        facetable           = true
        key                 = false
        indexAnalyzer       = null
        searchAnalyzer      = null
        analyzer            = null
        normalizer          = null
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name = "metadata"
        type = "Edm.ComplexType"
        fields = [
          {
            name                = "scope"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "address"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "app_android"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "app_ios"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "cta"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "description"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "email"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "pec"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "phone"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "privacy_url"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "support_url"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "token_name"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "tos_url"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "web_url"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "category"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "custom_special_flow"
            type                = "Edm.String"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          },
          {
            name                = "topic_id"
            type                = "Edm.Int32"
            searchable          = false
            filterable          = false
            retrievable         = true
            stored              = true
            sortable            = false
            facetable           = false
            key                 = false
            indexAnalyzer       = null
            searchAnalyzer      = null
            analyzer            = null
            normalizer          = null
            dimensions          = null
            vectorSearchProfile = null
            synonymMaps         = []
          }
        ]
      }
    ]
    scoringProfiles = []
    corsOptions = {
      allowedOrigins = [
        "*"
      ]
      maxAgeInSeconds = 300
    }
    suggesters = [
      {
        name       = "name"
        searchMode = "analyzingInfixMatching"
        sourceFields = [
          "name"
        ]
      }
    ]
    analyzers     = []
    normalizers   = []
    tokenizers    = []
    tokenFilters  = []
    charFilters   = []
    encryptionKey = null
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

resource "restapi_object" "services_indexer" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "services-full-indexer"
      dataSourceName  = restapi_object.services_datasource.id
      targetIndexName = restapi_object.services_index.id
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
      ]
      outputFieldMappings = []
      cache               = null
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.services_datasource]
}


