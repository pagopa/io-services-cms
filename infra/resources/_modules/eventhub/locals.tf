
locals {
  evhns = {

    use_case = "default"

    eventhubs = [{
      name                   = "services-lifecycle"
      partitions             = 5
      message_retention_days = 7
      consumers              = []
      keys = [
        {
          name   = var.cms_fn_name
          listen = false
          send   = true
          manage = false
        },
        {
          name   = "pdnd"
          listen = true
          send   = false
          manage = false
        }
      ]
      },
      {
        name                   = "services-publication"
        partitions             = 5
        message_retention_days = 7
        consumers              = []
        keys = [
          {
            name   = var.cms_fn_name
            listen = false
            send   = true
            manage = false
          },
          {
            name   = "pdnd"
            listen = true
            send   = false
            manage = false
          }
        ]
      },
      {
        name                   = "services-topic"
        partitions             = 5
        message_retention_days = 7
        consumers              = []
        keys = [
          {
            name   = var.cms_fn_name
            listen = false
            send   = true
            manage = false
          },
          {
            name   = "pdnd"
            listen = true
            send   = false
            manage = false
          }
        ]
      },
      {
        name                   = "services-history"
        partitions             = 5
        message_retention_days = 7
        consumers              = []
        keys = [
          {
            name   = var.cms_fn_name
            listen = false
            send   = true
            manage = false
          },
          {
            name   = "pdnd"
            listen = true
            send   = false
            manage = false
          }
        ]
      },
      {
        name                   = "activations"
        partitions             = 5
        message_retention_days = 7
        consumers              = []
        keys = [
          {
            name   = var.cms_fn_name
            listen = false
            send   = true
            manage = false
          },
          {
            name   = "pdnd"
            listen = true
            send   = false
            manage = false
          }
        ]
      }
    ]

    metric_alerts = {
      throttled_requests = {
        aggregation = "Total"
        metric_name = "ThrottledRequests"
        description = "Event Hubs requests were throttled in the last 15 minutes"
        operator    = "GreaterThan"
        threshold   = 0
        frequency   = "PT5M"
        window_size = "PT15M"
      },
      quota_exceeded_errors = {
        aggregation = "Total"
        metric_name = "QuotaExceededErrors"
        description = "Event Hubs quota was exceeded in the last 15 minutes"
        operator    = "GreaterThan"
        threshold   = 0
        frequency   = "PT5M"
        window_size = "PT15M"
      },
      server_errors = {
        aggregation = "Total"
        metric_name = "ServerErrors"
        description = "More than 100 Event Hubs server errors occurred in the last 15 minutes"
        operator    = "GreaterThan"
        threshold   = 100
        frequency   = "PT5M"
        window_size = "PT15M"
      },
    }

    allowed_sources = {
      subnet_ids = []
      ips = [
        "18.192.147.151", # PDND
        "18.159.227.69",  # PDND
        "3.126.198.129",  # PDND
        "52.29.215.8",    # PDND
        "63.181.230.22",  # PDND
        "52.29.74.207"    # PDND
      ]
    }
  }
}
