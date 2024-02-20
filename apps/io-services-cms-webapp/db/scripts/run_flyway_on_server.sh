#!/usr/bin/env bash

#
# Apply migrations on a given PostgresSql server instance
#
# Usage:
#  ./run_flyway_on_server.sh <Flyway command> <all other parameters> <Flyway command options>
#
# See parameters below for detailed explanation
#

set -e

printf "Running run_flyway_on_server.sh\n"

#
# Parameters
#
# Flyway command to run, either info, validate or migrate
FLYWAY_COMMAND=$1
# name of the db to play sql scripts against
DB_NAME=$2
# Host and port of the Postrgres server instance
DB_SERVER_HOST=$3
DB_SERVER_PORT=$4
# Credentials of the db user running sql scripts
DB_ADMIN_USER="pgadminusr"
DB_ADMIN_PASSWORD=$5
DB_USER_APP="reviewerusr"
DB_USER_APP_PASSWORD=$6
DB_READONLY_USER="readonlyusr"
DB_READONLY_USER_PASSWORD=$7
# Directory containing migrations for ALL databases.
#  Relative to the project root, the actual sql scripts will be in ${SQL_MIGRATIONS_DIR}/${DB_NAME}
SQL_MIGRATIONS_DIR=$8

# Get all other parametemeters, so we can append them to Flyway command
shift 8
other=$@

#-------

BASHDIR="$( cd "$( dirname "$BASH_SOURCE" )" >/dev/null 2>&1 && pwd )"
WORKDIR="$BASHDIR"
if [[ $WORKDIR == /cygdrive/* ]]; then
  WORKDIR=$(cygpath -w ${WORKDIR})
  WORKDIR=${WORKDIR//\\//}
fi

export DB_URL="jdbc:postgresql://${DB_SERVER_HOST}:${DB_SERVER_PORT}/${DB_NAME}"
export FLYWAY_USER="${DB_ADMIN_USER}"
export FLYWAY_PASSWORD="${DB_ADMIN_PASSWORD}"
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
  -placeholders.appUserPassword=${DB_USER_APP_PASSWORD} \
  -placeholders.readonlyUser=${DB_READONLY_USER} \
  -placeholders.readonlyUserPassword=${DB_READONLY_USER_PASSWORD} \
  "${FLYWAY_COMMAND}" ${other}
