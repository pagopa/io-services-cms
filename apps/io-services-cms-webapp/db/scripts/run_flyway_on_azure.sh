#!/usr/bin/env bash

#
# Apply the configuration relative to a given subscription
# Usage:
#  ./flyway.sh info|validate|migrate <DB_NAME> <AZURE_SUBSCRIPTION> <SQL_MIGRATIONS_DIR>
#
# See parameters below for detailed explanation
#

printf "Running run_flyway_on_azure.sh\n"

#
# Parameters
#

# Flyway command to run, either info, validate or migrate
FLYWAY_COMMAND=$1
# name of the db to play sql scripts against
DB_NAME=$2

# Azure subscription to operate with
AZ_SUBSCRIPTION=$3
# Postgres Server resource name on Azure
AZ_POSTGRES_RESOURCE_NAME="io-p-services-cms-private-pgflex"
# KeyVault info to fetch server credentials
KV_NAME="io-p-services-cms-kv"
KV_DB_ADMIN_PASSWORD_KEY="pgres-flex-admin-pwd"
KV_DB_USER_APP_PASSWORD_KEY="pgres-flex-reviewer-usr-pwd"
DB_ADMIN_USER="pgadminusr"

# Directory containing migrations for ALL databases.
#  Relative to the project root, the actual sql scripts will be in ${SQL_MIGRATIONS_DIR}/${DB_NAME}
SQL_MIGRATIONS_DIR=$4

# DB User used by the app with reand and write permission over the DB resources used by the app
DB_USER_APP=$5

# Get all other parametemeters, so we can append them to Flyway command
shift 5
other=$@

#-------

#
# Colletting credentials from Azure
#

if [ -z "${AZ_SUBSCRIPTION}" ]; then
    printf "\e[1;31mYou must provide a subscription as first argument.\n"
    exit 1
fi

az account set -s "${AZ_SUBSCRIPTION}"

# shellcheck disable=SC2154
printf "Subscription: %s\n" "${AZ_SUBSCRIPTION}"

psql_server_name=$(az postgres flexible-server list -o tsv --query "[?contains(name,'$AZ_POSTGRES_RESOURCE_NAME')].{Name:name}" | head -1)
psql_server_private_fqdn=$(az postgres flexible-server list -o tsv --query "[?contains(name,'$AZ_POSTGRES_RESOURCE_NAME')].{Name:fullyQualifiedDomainName}" | head -1)
keyvault_name=$(az keyvault list -o tsv --query "[?contains(name,'$KV_NAME')].{Name:name}")

# in widows, even if using cygwin, these variables will contain a landing \r character
psql_server_name=${psql_server_name//[$'\r']}
psql_server_private_fqdn=${psql_server_private_fqdn//[$'\r']}
keyvault_name=${keyvault_name//[$'\r']}

printf "Server name: %s\n" "${psql_server_name}"
printf "Server FQDN: %s\n" "${psql_server_private_fqdn}"
printf "KeyVault name: %s\n" "${keyvault_name}"

administrator_login=${DB_ADMIN_USER}
administrator_login_password=$(az keyvault secret show --name ${KV_DB_ADMIN_PASSWORD_KEY} --vault-name "${keyvault_name}" -o tsv --query value)

# in widows, even if using cygwin, these variables will contain a landing \r character
administrator_login=${administrator_login//[$'\r']}
administrator_login_password=${administrator_login_password//[$'\r']}

user_app_password=$(az keyvault secret show --name ${KV_DB_USER_APP_PASSWORD_KEY} --vault-name "${keyvault_name}" -o tsv --query value)
user_app_password=${user_app_password//[$'\r']}

#-------

BASHDIR="$( cd "$( dirname "$BASH_SOURCE" )" >/dev/null 2>&1 && pwd )"
WORKDIR="$BASHDIR"
if [[ $WORKDIR == /cygdrive/* ]]; then
  WORKDIR=$(cygpath -w ${WORKDIR})
  WORKDIR=${WORKDIR//\\//}
fi

export DB_URL="jdbc:postgresql://${psql_server_private_fqdn}:5432/${DB_NAME}?sslmode=require"
export FLYWAY_USER="${administrator_login}"
export FLYWAY_PASSWORD="${administrator_login_password}"
export FLYWAY_DOCKER_TAG="10.1.0-alpine@sha256:8fc732d96d575b2b1f495be8d4bbb2d81fa0c712809dbd8320407cf76912d2cc"
export FLYWAY_SQL_DIR="$(pwd)/${SQL_MIGRATIONS_DIR}/${DB_NAME}"

printf "Running Flyway docker container\n"
printf "DB_URL: %s\n" "$DB_URL"
printf "FLYWAY_SQL_DIR: %s\n" "$FLYWAY_SQL_DIR"
docker run --rm --network=host -v "${FLYWAY_SQL_DIR}":/flyway/sql \
  flyway/flyway:"${FLYWAY_DOCKER_TAG}" \
  -url="${DB_URL}" -user="${FLYWAY_USER}" -password="${FLYWAY_PASSWORD}" \
  -validateMigrationNaming=true \
  -placeholders.appUser=${DB_USER_APP} \
  -placeholders.appUserPassword=${user_app_password} \
  "${FLYWAY_COMMAND}" ${other}