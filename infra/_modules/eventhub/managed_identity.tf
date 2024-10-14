module "eventhub_role_assignments" {
  source       = "github.com/pagopa/dx//infra/modules/azure_role_assignments?ref=main"
  principal_id = var.cms_fn_principal_id

  event_hub = [
    {
      namespace_name      = module.eventhub.name
      resource_group_name = var.resource_group_name
      role                = "writer"
    }
  ]
}