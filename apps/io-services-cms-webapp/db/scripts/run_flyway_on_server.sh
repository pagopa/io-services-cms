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
DB_ADMIN_USER=$5
DB_ADMIN_PASSWORD=$6
DB_USER_APP=$7
DB_USER_APP_PASSWORD=$8
# Directory containing migrations for ALL databases.
#  Relative to the project root, the actual sql scripts will be in ${SQL_MIGRATIONS_DIR}/${DB_NAME}
SQL_MIGRATIONS_DIR=$9

# Get all other parametemeters, so we can append them to Flyway command
shift 9
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
export FLYWAY_DOCKER_TAG="7.11.1-alpine@sha256:88e1b077dd10fd115184383340cd02fe99f30a4def08d1505c1a4db3c97c5278"
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
  "${FLYWAY_COMMAND}" ${other}
