resource "restapi_object" "organizations_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "services-cms-org",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=/subscriptions/${data.azurerm_subscription.current.id}/resourceGroups/${data.azurerm_cosmosdb_account.cosmos.resource_group_name}/providers/Microsoft.DocumentDB/databaseAccounts/${data.azurerm_cosmosdb_account.cosmos.name}/(IdentityAuthType=[AccessToken])" },
      container = {
        name  = "services-publication"
        query = "SELECT c.data.organization.fiscal_code, c.data.organization.name, c.data.metadata.scope, c.fsm.state, c._ts FROM c WHERE c._ts >= @HighWaterMark ORDER BY c._ts"
      },
      dataChangeDetectionPolicy = {
        "@odata.type"           = "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        highWaterMarkColumnName = "_ts"
      },
      dataDeletionDetectionPolicy = {
        "@odata.type" : "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        softDeleteColumnName  = "fsm.state",
        softDeleteMarkerValue = "unpublished"
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

resource "restapi_object" "organizations_index" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "organizations-full-index"
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
        analyzer            = "my_analyzer"
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
        name                = "fiscal_code"
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
      }
    ]
    scoringProfiles = [
      {
        name                = "BoostScope"
        functionAggregation = "sum"
        text                = null
        functions = [
          {
            fieldName     = "scope"
            interpolation = "constant"
            type          = "tag"
            boost         = 3
            freshness     = null
            magnitude     = null
            distance      = null
            tag = {
              tagsParameter = "boostScope"
            }
          }
        ]
      }
    ]
    corsOptions = null
    suggesters  = []
    analyzers = [
      {
        "@odata.type" = "#Microsoft.Azure.Search.CustomAnalyzer"
        name          = "my_analyzer"
        tokenizer     = "myTokenizer"
        tokenFilters = [
          "italianStopWord",
          "asciifolding",
          "lowercase"
        ]
        charFilters = [
          "remove_whitespace"
        ]
      }
    ]
    normalizers = []
    tokenizers = [
      {
        "@odata.type" = "#Microsoft.Azure.Search.NGramTokenizer"
        name          = "myTokenizer"
        minGram       = 3
        maxGram       = 5
        tokenChars    = []
      }
    ]
    tokenFilters = [
      {
        "@odata.type"  = "#Microsoft.Azure.Search.StopwordsTokenFilter"
        name           = "italianStopWord"
        stopwords      = []
        stopwordsList  = "italian"
        ignoreCase     = false
        removeTrailing = true
      }
    ]
    charFilters = [
      {
        "@odata.type" = "#Microsoft.Azure.Search.MappingCharFilter"
        name          = "remove_whitespace"
        mappings = [
          "\\u0020=>"
        ]
      }
    ]
    encryptionKey = null
    similarity = {
      "@odata.type" = "#Microsoft.Azure.Search.BM25Similarity"
      k1            = null
      b             = null
    }
    semantic     = null
    vectorSearch = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "organizations_indexer" {
  path         = "/indexers"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name            = "organizations-full-indexer"
      dataSourceName  = restapi_object.organizations_datasource.id
      targetIndexName = restapi_object.organizations_index.id
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
          sourceFieldName = "fiscal_code"
          targetFieldName = "fiscal_code"
          mappingFunction = null
        },
        {
          sourceFieldName = "fiscal_code"
          targetFieldName = "id"
          mappingFunction = null
        }
      ]
      outputFieldMappings = []
      cache               = null
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.organizations_datasource]
}


