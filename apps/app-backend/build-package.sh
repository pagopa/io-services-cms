#!/bin/bash

# Read package name and version from package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

# Create deploy directory
DEPLOY_DIR="deploy-temp"
ZIP_NAME="${PACKAGE_NAME}-${PACKAGE_VERSION}.zip"

echo "Working directory: $(pwd)"
echo "Building package: ${ZIP_NAME}"

# Remove old deploy directory if it exists
rm -rf "${DEPLOY_DIR}"

# Deploy using pnpm (--filter=. selects current package)
pnpm deploy --filter=. --prod "${DEPLOY_DIR}"

# Create zip from the deployed directory
cd "${DEPLOY_DIR}" && zip -r "../${ZIP_NAME}" . && cd ..

# Clean up
rm -rf "${DEPLOY_DIR}"

echo "Package created: ${ZIP_NAME}"
