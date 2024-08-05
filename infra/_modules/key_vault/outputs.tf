output "key_vault_id" {
  value = module.key_vault.id
}

output "secrets_name" {
  value = local.key_vault.secrets_name
}