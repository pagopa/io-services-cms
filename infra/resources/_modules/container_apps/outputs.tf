output "services_app_hostname" {
  value       = module.services_ca.url
  description = "Services App Container App ingress hostname, without scheme or path"
}