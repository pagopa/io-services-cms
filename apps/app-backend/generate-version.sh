#!/bin/bash

outputDir="./"
version="0.0.0"
appName=""

while getopts "o:v:n:" opt; do
  case ${opt} in
    o )
      outputDir="$OPTARG"
      ;;
    v )
      version="$OPTARG"
      ;;
    n )
      appName="$OPTARG"
      ;;
    \? )
      echo "Usage: $0 -o outputDir -v version -n appName"
      exit 1
      ;;
  esac
done

# Remove existing file if it exists
if [ -f "${outputDir}/version.ts" ]; then
  rm "${outputDir}/version.ts"
fi

# Create file
echo "export const APPLICATION_NAME = '${appName}';" > "${outputDir}/version.ts"
echo "export const APPLICATION_VERSION = '${version}';" >> "${outputDir}/version.ts"

echo "Created version file in ${outputDir}/version.ts"