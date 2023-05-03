# Terraform development

What you need to know to contribute on infrastraction resources' code.

----

## Requirements

### 1. terraform

In order to manage the suitable version of terraform it is strongly recommended to install the following tool:

- [tfenv](https://github.com/tfutils/tfenv): **Terraform** version manager inspired by rbenv.

Once these tools have been installed, install the terraform version shown in:

- .terraform-version

After installation install terraform:

```sh
tfenv install
```

## Run terraform commands

We have a `./terraform.sh` file in each terraform project. These files execute terraform by properly configuring Azure credentials and environment variables.
To run a terraform command, move in the folder where the code is and specify an environment to run the command against:

```sh
./terraform.sh init [dev|uat|prod]

./terraform.sh plan [dev|uat|prod]

./terraform.sh apply [dev|uat|prod]
```

## Terraform lock.hcl

We have both developers who work with your Terraform configuration on their Linux, macOS or Windows workstations and automated systems that apply the configuration while running on Linux.
https://www.terraform.io/docs/cli/commands/providers/lock.html#specifying-target-platforms

So we need to specify this in terraform lock providers:

```sh
./terraform.sh init [dev|uat|prod]

rm .terraform.lock.hcl

terraform providers lock \
  -platform=windows_amd64 \
  -platform=darwin_amd64 \
  -platform=darwin_arm64 \
  -platform=linux_amd64
```

## Precommit checks

Check your code before commit.

https://github.com/antonbabenko/pre-commit-terraform#how-to-install

```sh
pre-commit run -a
```

This will format and lint your code, as well as automatically generate references in the relative README file (the file must be commited).
