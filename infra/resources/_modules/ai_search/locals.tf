locals {
  snet_cidrs           = ["10.20.4.0/26"] # Picked as the first available non-allocated CIDR from the io-p-itn-common-vnet-01
  sku                  = "standard"
  replica_count        = 3 # The replica_count must be between 1 and 12
  partition_count      = 1 # The partition_count must be one of the following values: 1, 2, 3, 4, 6, 12.
  cosmos_database_name = "db-services-cms"
  index_aliases = {
    organizations = "organizations"
    services      = "services"
  }
  indexers_scheduling_interval = {
    organizations        = "PT1H"
    services_lifecycle   = "PT1H"
    services_publication = "PT1H"
  }
}

