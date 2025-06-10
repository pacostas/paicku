# paicku

A CLI for containerizing applications using buidpacks

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/paicku.svg)](https://npmjs.org/package/paicku)
[![Downloads/week](https://img.shields.io/npm/dw/paicku.svg)](https://npmjs.org/package/paicku)

# Usage

```sh-session
$ npm install -g paicku
$ paicku build .
```

In case you don't want to install paicku globally, use npx instead

```sh-session
$ npx paicku build .
```

# Available commands

<!-- commands -->
# Command Topics

* [`paicku help`](docs/help.md) - Display help for paicku.

<!-- commandsstop -->

## Development

Install the required Node.js modules

```
npm i
```

### Run CLI in developemnt mode:

Use the following command to run the CLI in development mode:

```
./bin/dev.js
```

### Run CLI in production mode:

To run the CLI in production mode, you need to build the application first. Run the build command:

```
npm run build
```

Then, execute the CLI:

```
./bin/run.js
```

Note: You must rebuild every time you make changes to the source code

### Running tests

To run unit tests:

```
npm run test:unit
```

To run unit tests in debug mode (e.g., for using .only or extended execution time):

```
npm run test:unit:debug
```

To run integration tests:

```
npm run test:integration
```

To run integration tests in debug mode:

```
npm run test:integration:debug
```

For more info, refer to the [OCLI documentation](https://oclif.io/docs/introduction)
