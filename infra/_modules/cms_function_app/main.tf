##################
#  Function App  #
##################

module "cms_fn" {
  source = "github.com/pagopa/dx//infra/modules/azure_function_app?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "cms"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/info"
  node_version        = 18

  subnet_cidr                          = local.cms.snet_cidr
  subnet_pep_id                        = var.peps_snet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  # All async trigger shutdown initially
  app_settings = merge(
    local.cms.app_settings,
    {
      "AzureWebJobs.LegacyServiceWatcher.Disabled"            = "1"
      "AzureWebJobs.ServiceLifecycleWatcher.Disabled"         = "1"
      "AzureWebJobs.ServicePublicationWatcher.Disabled"       = "1"
      "AzureWebJobs.ServiceReviewChecker.Disabled"            = "1"
      "AzureWebJobs.ServiceHistoryWatcher.Disabled"           = "1"
      "AzureWebJobs.OnRequestHistoricization.Disabled"        = "1"
      "AzureWebJobs.OnRequestPublication.Disabled"            = "1"
      "AzureWebJobs.OnRequestReview.Disabled"                 = "1"
      "AzureWebJobs.OnRequestSyncCms.Disabled"                = "1"
      "AzureWebJobs.OnRequestSyncLegacy.Disabled"             = "1"
      "AzureWebJobs.OnRequestReviewLegacy.Disabled"           = "1"
      "AzureWebJobs.ServiceReviewLegacyChecker.Disabled"      = "1"
      "AzureWebJobs.OnRequestValidation.Disabled"             = "1"
      "AzureWebJobs.OnRequestDeletion.Disabled"               = "1"
      "AzureWebJobs.OnRequestDetail.Disabled"                 = "1"
      "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled"   = "1"
      "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled" = "1"
    }
  )

  slot_app_settings = merge(
    local.cms.app_settings,
    {
      "AzureWebJobs.LegacyServiceWatcher.Disabled"            = "1"
      "AzureWebJobs.ServiceLifecycleWatcher.Disabled"         = "1"
      "AzureWebJobs.ServicePublicationWatcher.Disabled"       = "1"
      "AzureWebJobs.ServiceReviewChecker.Disabled"            = "1"
      "AzureWebJobs.ServiceHistoryWatcher.Disabled"           = "1"
      "AzureWebJobs.OnRequestHistoricization.Disabled"        = "1"
      "AzureWebJobs.OnRequestPublication.Disabled"            = "1"
      "AzureWebJobs.OnRequestReview.Disabled"                 = "1"
      "AzureWebJobs.OnRequestSyncCms.Disabled"                = "1"
      "AzureWebJobs.OnRequestSyncLegacy.Disabled"             = "1"
      "AzureWebJobs.OnRequestReviewLegacy.Disabled"           = "1"
      "AzureWebJobs.ServiceReviewLegacyChecker.Disabled"      = "1"
      "AzureWebJobs.OnRequestValidation.Disabled"             = "1"
      "AzureWebJobs.OnRequestDeletion.Disabled"               = "1"
      "AzureWebJobs.OnRequestDetail.Disabled"                 = "1"
      "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled"   = "1"
      "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled" = "1"
    }
  )

  sticky_app_setting_names = [
    "AzureWebJobs.LegacyServiceWatcher.Disabled",
    "AzureWebJobs.ServiceLifecycleWatcher.Disabled",
    "AzureWebJobs.ServicePublicationWatcher.Disabled",
    "AzureWebJobs.ServiceReviewChecker.Disabled",
    "AzureWebJobs.ServiceHistoryWatcher.Disabled",
    "AzureWebJobs.OnRequestHistoricization.Disabled",
    "AzureWebJobs.OnRequestPublication.Disabled",
    "AzureWebJobs.OnRequestReview.Disabled",
    "AzureWebJobs.OnRequestSyncCms.Disabled",
    "AzureWebJobs.OnRequestSyncLegacy.Disabled",
    "AzureWebJobs.OnRequestReviewLegacy.Disabled",
    "AzureWebJobs.ServiceReviewLegacyChecker.Disabled",
    "AzureWebJobs.OnRequestValidation.Disabled",
    "AzureWebJobs.OnRequestDeletion.Disabled",
    "AzureWebJobs.OnRequestDetail.Disabled",
    "AzureWebJobs.ServiceDetailLifecycleWatcher.Disabled",
    "AzureWebJobs.ServiceDetailPublicationWatcher.Disabled"
  ]

  tier = local.cms.tier

  tags = var.tags
}
