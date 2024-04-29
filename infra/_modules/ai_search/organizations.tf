resource "restapi_object" "organizations_datasource" {
  path         = "/datasources"
  query_string = "api-version=2023-11-01"
  data = jsonencode(
    {
      name        = "ds-organization-01",
      description = "${data.azurerm_cosmosdb_account.cosmos.name} datasource for ${azurerm_search_service.srch.name} AI Search Service",
      type        = "cosmosdb",
      credentials = { connectionString = "ResourceId=${data.azurerm_cosmosdb_account.cosmos.id};Database=${var.cosmos_database_name};IdentityAuthType=AccessToken;" },
      container = {
        name  = "services-publication"
        query = "SELECT c.data.organization.fiscal_code, c.data.organization.name, c.data.metadata.scope, c.fsm.state, c._ts FROM c WHERE c.fsm.state = \"published\" and c._ts >= @HighWaterMark ORDER BY c._ts"
      },
  })
  force_new    = ["name"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader]
}

resource "restapi_object" "organizations_index_01" {
  path         = "/indexes"
  query_string = "api-version=2023-11-01"
  data = jsonencode({
    name                  = "idx-organization-01"
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
        sortable            = false
        facetable           = false
        key                 = false
        analyzer            = "organizationCustomAnalyzer"
        dimensions          = null
        vectorSearchProfile = null
        synonymMaps         = []
      },
      {
        name                = "scope"
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
        name                = "fiscal_code"
        type                = "Edm.String"
        searchable          = false
        filterable          = false
        retrievable         = true
        sortable            = false
        facetable           = false
        key                 = false
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
        name          = "organizationCustomAnalyzer"
        tokenizer     = "customNGramTokenizer"
        tokenFilters = [
          "italianStopWord",
          "asciifolding",
          "lowercase"
        ]
        charFilters = [
          "removeWhitespace"
        ]
      }
    ]
    tokenizers = [
      {
        "@odata.type" = "#Microsoft.Azure.Search.NGramTokenizer"
        name          = "customNGramTokenizer"
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
        name          = "removeWhitespace"
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
      name            = "idxr-organization-01"
      dataSourceName  = restapi_object.organizations_datasource.id
      targetIndexName = restapi_object.organizations_index_01.id
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
      encryptionKey       = null
  })
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.organizations_datasource]
}

resource "restapi_object" "organizations_alias" {
  path         = "/aliases"
  query_string = "api-version=2024-03-01-Preview"
  data = jsonencode(
    {
      name    = var.index_aliases.organizations
      indexes = [restapi_object.organizations_index_01.id]
    }
  )
  force_new    = ["indexes"]
  id_attribute = "name" # The ID field on the response
  depends_on   = [azurerm_role_assignment.search_to_cosmos_account_reader, azurerm_cosmosdb_sql_role_assignment.search_to_cosmos_data_reader, restapi_object.organizations_datasource]
}
