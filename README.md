# Suprachat Backend

[![pipeline status](https://gitlab.com/suprachat/backend/badges/main/pipeline.svg)](https://gitlab.com/suprachat/backend/-/commits/main)

This is a very simple service/API for interacting with an IRC daemon using the `draft/account-registration` capability,
written entirely in TypeScript.

Built with:

- [Fastify](https://www.fastify.io/)
- [TypeBox](https://github.com/sinclairzx81/typebox)
- [Papr](https://plexinc.github.io/papr/#/)

## Development environment

### Pre-requisites

OS dependencies:

- Node.js >= 18.16
- PNPM >= 8

You'll also need to copy `.env.example` into `.dev` and replace its contents according to your use case.

```
# install dependencies
pnpm install

# Start server in development mode
pnpm dev
```

### Running tests

Run tests in watch mode to get instant feedback (powered by [vitest](https://vitest.dev/)):

```
pnpm test
```

Run tests with coverage reporting:

```
pnpm coverage
```

### Linting, formatting and type-checking

This project uses pre-commit hooks (powered by [husky](https://typicode.github.io/husky/)),
so you should not have to run these manually:

```
# Lint and fix fixable
pnpm lint

# Only check for errors
pnpm lint:check

# Format and fix
pnpm format

# Only check for style issues
pnpm format:check
```

This project uses [tsx](https://github.com/esbuild-kit/tsx) as its runtime, so transpiling
to JS is not necessary, `tsc` is only used for type-checking, which should be done by your
IDE as you code, but can be run manually:

```
pnpm typecheck
```
