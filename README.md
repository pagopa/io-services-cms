# IO Services CMS
Manages Service lifecycle and publication.

[![Infra Drift Detection](https://github.com/pagopa/io-services-cms/actions/workflows/infra-drift-detection.yml/badge.svg?branch=master)](https://github.com/pagopa/io-services-cms/actions/workflows/infra-drift-detection.yml)
[![Infra Continuous Delivery](https://github.com/pagopa/io-services-cms/actions/workflows/infra-cd.yml/badge.svg?branch=master)](https://github.com/pagopa/io-services-cms/actions/workflows/infra-cd.yml)

---

## Architecture

![architecture](./docs/infra.drawio.svg)

## Folder structure
TBD

## Development

### Cloud resources
Cloud resources are defined using terraform for infrastructure-as-code development. There are two terraform projects in this repository:
* `infra` define the resources used by the application
* `.identity` connects GitHub's workflow to be executed by our custom runners (hence inheriting resource access policies). 

Please refer to our [development guide](./docs/terraform-development.md) before contributing.
