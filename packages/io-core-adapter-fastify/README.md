# @pagopa/io-core-domain

Shared domain primitives for the IO platform ecosystem.

## Overview

This package provides reusable domain building blocks — errors, entities, and value objects — to be consumed both within the `io-platform-core` monorepo and, eventually, published to npm.

## Structure

```
src/
├── errors/        # Domain error classes (BaseError, NotFoundError, …)
├── entities/      # Domain entities
├── value-objects/ # Value objects
└── index.ts       # Public barrel export
```

## Usage

```ts
import { NotFoundError, ValidationError } from "@pagopa/io-core-domain";
```

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `pnpm build`         | Compile TypeScript to `dist/`  |
| `pnpm typecheck`     | Type-check without emitting    |
| `pnpm lint:check`    | Run ESLint                     |
| `pnpm test`          | Run tests with Vitest          |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm clean`         | Remove `dist/`                 |
