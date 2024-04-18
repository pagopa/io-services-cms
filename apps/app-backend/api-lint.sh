#!/bin/bash
find ./api -name '*.yaml' -exec swagger-cli validate {} \;