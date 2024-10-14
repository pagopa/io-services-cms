output "cms_fn_default_hostname" {
  value = module.cms_fn.function_app.function_app.default_hostname
}


output "cms_fn_name" {
  value = module.cms_fn.function_app.function_app.name
}


output "cms_fn_principal_id" {
  value = module.cms_fn.function_app.function_app.principal_id
}