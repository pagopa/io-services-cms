locals {
  project              = "${var.prefix}-${var.env_short}"
  is_prod              = var.env_short == "p" ? true : false
  application_basename = "services-cms"
  cosmos_containers = {
    services_lifecycle   = "services-lifecycle"
    services_publication = "services-publication"
    services_history     = "services-history"
    services_details     = "services"
  }
}
  