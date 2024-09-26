locals {
  project              = "${var.prefix}-${var.env_short}"
  is_prod              = var.env_short == "p" ? true : false
  application_basename = "services-cms"
  cosmos_containers = {
    services_lifecycle    = "services-lifecycle"
    services_publication  = "services-publication"
    services_history      = "services-history"
    services_history_test = "services-history-test"
    services_details      = "services"
  }
}

# Region ITN
locals {
  project_itn        = "${var.prefix}-${var.env_short}-${local.itn_location_short}"
  itn_location       = "italynorth"
  itn_location_short = "itn"
  common_project_itn = "${local.project}-${local.itn_location_short}"

  vnet_common_name_itn                = "${local.common_project_itn}-common-vnet-01"
  vnet_common_resource_group_name_itn = "${local.common_project_itn}-common-rg-01"
}
