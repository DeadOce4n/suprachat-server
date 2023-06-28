# Suprachat Backend

[![pipeline status](https://gitlab.com/suprachat/backend/badges/main/pipeline.svg)](https://gitlab.com/suprachat/backend/-/commits/main)
[![coverage report](https://gitlab.com/suprachat/backend/badges/main/coverage.svg)](https://gitlab.com/suprachat/backend/-/commits/main)
[![code style](https://img.shields.io/badge/code%20style-prettier-F7B93E?logo=Prettier)](https://prettier.io)

This is a very simple REST-ish API for managing user accounts on SupraChat's IRC network. It allows account registration
on the IRC daemon through the [`draft/account-registration`](https://ircv3.net/specs/extensions/account-registration)
capability. It's written entirely in TypeScript.

Built with:

- [Fastify](https://www.fastify.io/)
- [TypeBox](https://github.com/sinclairzx81/typebox)
- [Papr](https://plexinc.github.io/papr/#/)
- [Vitest](https://vitest.dev/)
- [Dagger](https://dagger.io/)

And many more awesome, open source tools and libraries!

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

> The server's API docs can be accessed at [http://localhost:3000/docs](http://localhost:3000/docs) (change the port to whatever you've chosen).

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
to JS is not necessary. `tsc` is only used for type-checking (both in CI and in your IDE as
you code), but can be run manually:

```
pnpm typecheck
```

### Pipeline testing

This project uses [Dagger](https://dagger.io/), which means CI/CD can be tested locally
with the following command:

```
pnpm dagger
```

> **Pro tip:** [install the Dagger CLI](https://docs.dagger.io/cli/465058/install) and use `dagger run pnpm dagger` instead to get fancier terminal output
