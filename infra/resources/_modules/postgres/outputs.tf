output "pgres_snet" {
  value = {
    id   = module.pgres_snet.id
    name = module.pgres_snet.name
  }
  description = "Id and name of the postgres snet"
}