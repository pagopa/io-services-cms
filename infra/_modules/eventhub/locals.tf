
locals {
  evhns = {
    tier = "m" //TODO: is this correct?

    eventhubs = [{
      name                   = "services-lifecycle"
      partitions             = 5
      message_retention_days = 7
      consumers              = []
      keys = [
        {
          name   = var.cms_fn_name // GET FROM VARIABLE
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
            name   = var.cms_fn_name // GET FROM VARIABLE
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
            name   = var.cms_fn_name // GET FROM VARIABLE
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
    }]

    metric_alerts = [
      {
        aggregation = "Count"
        metric_name = "ThrottledRequests"
        description = "Alert for Too Many Throttled Requests"
        operator    = "GreaterThan"
        threshold   = 10 #TODO: FINE TUNING NEEDED
        frequency   = "PT5M"
        window_size = "PT15M"
      },
      {
        aggregation = "Count"
        metric_name = "UserErrors"
        description = "Alert for Too Many User Errors"
        operator    = "GreaterThan"
        threshold   = 1 #TODO: FINE TUNING NEEDED
        frequency   = "PT5M"
        window_size = "PT15M"
      },
      {
        aggregation = "Maximum"
        metric_name = "CPU"
        description = "Alert for Too High CPU Usage"
        operator    = "GreaterThan"
        threshold   = 90 #TODO: FINE TUNING NEEDED
        frequency   = "PT5M"
        window_size = "PT15M"
      }
    ]
  }
}
