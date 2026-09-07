# Paicku

Paicku, is a Node.js library and command-line application for containerizing applications with buildpacks. It is a wrapper around Cloud Native Buildpacks' [pack CLI](https://github.com/buildpacks/pack).

## Why?

- **Zero setup.** Automatically downloads the official `pack` binary on the first run.
- **Zero configuration.** Automatically detects your running container daemon (Docker or Podman) based on the OS and configures it.
- **End-to-End Testing.** Allows you to build and run containers with Node.js, to write robust integration tests.
- **TypeScript Ready.** First-class TypeScript support with native type definitions included out of the box.
- **Choose runtime.** Allows you to specify which container runtime would like to use, just by specifying the corresponding argument.

## Installation

You can install Paicku globally through npm, yarn, or pnpm. Alternatively, drop the global flag (`global`/`-g`) to use it in your Node.js project.

```sh
# npm
npm install -g paicku

# yarn
yarn global add paicku

# pnpm
pnpm add -g paicku
```

## Usage

We officially support two interfaces for Paicku:

- Command-line application
- Node.js library - For general use in Node.js.

### Command-line Usage

Containerizing an application

```
paicku build --path ./app
```

### Node.js library

To use Paicku, ensure you've installed the depenency, then import the `createPaicku` object.

Here's a minimal example

```javascript
import {createPaicku} from 'paicku'

const paicku = createPaicku()

console.log('Containerizing app...')
const image = await paicku.build({path: './app'})

console.log('Starting container')
const container = await image.run({exposedPorts: 8080})

// Make a request to the running container application
const response = await fetch(container.getUrl())

console.log('Response status:', response.status)
console.log('Stopping and removing container...')
await container.stop()
```

**Note:** See [paicku examples](https://github.com/nodeshift-starters/paicku-examples/) for complete scripts.

<!-- commands -->

## Command Topics

The ClI and Nodee.js library, support the following topics

- [`paicku build`](docs/build.md) - Build an image
- [`paicku builder`](docs/builder.md) - Display suggested builders for the given application
- [`paicku help`](docs/help.md) - Display help for paicku.
- [`paicku inspect`](docs/inspect.md) - Show information about a built app image
- [`paicku sbom`](docs/sbom.md) - Interact with SBoM

<!-- commandsstop -->

## Node.js and CLI Examples

### Writing tests with Mocha and Chai:

Node.js

```javascript
import {expect} from 'chai'
import {after, before, describe, it} from 'mocha'
import {createPaicku, PaickuError} from 'paicku'

const appPath = './app'
const appPort = 8080

describe('Mocha, Chai and Paicku', function () {
  this.timeout(600_000) // Give some time for the build to complete

  const paicku = createPaicku()

  let containerImage
  let container

  before(async () => {
    containerImage = await paicku.build({
      builder: 'docker.io/paketobuildpacks/builder-ubi8-base',
      path: appPath,
    })
  })

  after(async () => {
    if (container) {
      await container.stop()
    }
  })

  it('should successfully build and run an app', async () => {
    container = await containerImage.run({exposedPorts: appPort})
    const response = await fetch(container.getUrl())
    expect(response.status).to.equal(200)
  })
})
```

**Important:** Always pass `exposedPorts` when you need a URL, as there is no default port mapping.

### Configuring default behaviour of paicku

You can optionally define a custom working directory or provide a local path to the pack executable if you prefer not to download the default one.

```javascript
const paicku = createPaicku({
  cwd: process.cwd(), // Optional: working directory for Paicku
  executablePath: '/path/to/pack', // Optional: skips automatic download
})
```

### Selecting container runtime

You can choose which container runtime you prefer [podman or docker]:

CLI:

```sh
paicku build my-app --container-runtime docker
```

Node.js:

```javascript
const paicku = createPaicku()

const result = await paicku.build({
  imageName: 'my-app',
  'container-runtime': 'docker',
})
```

### Build with a specific builder and environement variables

CLI:

```sh
paicku build nodejs-noble-container-image \
    --builder docker.io/paketobuildpacks/ubuntu-noble-builder \
    --run-image docker.io/paketobuildpacks/ubuntu-noble-run-tiny \
    --env BP_LAUNCH_WITH_TINI=true
```

Node.js:

```javascript
const paicku = createPaicku()

const result = await paicku.build({
  imageName: 'nodejs-noble-container-image',
  builder: 'docker.io/paketobuildpacks/ubuntu-noble-builder',
  runtImage: 'docker.io/aketobuildpacks/ubuntu-noble-run-tiny',
  env: ['BP_LAUNCH_WITH_TINI=true'],
})
```

**Note:** The builder must include a registry prefix (`docker.io/`, `ghcr.io/`, …).

### Build from a remote Git repository

Append `:<subdirectory>` to the Git URL when the app is not at the repository root.

CLI:

```sh
paicku build backend-image --path https://github.com/nodeshift/mern-workshop:backend
```

Node.js:

```javascript
const paicku = createPaicku()

const result = await paicku.build({
  imageName: 'backend-image',
  path: 'https://github.com/nodeshift/mern-workshop:backend',
})
```

### Inspect a container image

Inspect your application by using the inspect command

CLI:

```sh
paicku inspect my-containerized-app:latest --output json
```

Node.js:

```javascript
const paicku = createPaicku()

const result = await paicku.inspect('my-containerized-app:latest', {
  output: 'json',
})

console.log(result.parsedStdout)
```

### Suggest a builder

CLI:

```sh
paicku builder suggest
```

Node.js:

```javascript
const paicku = createPaicku()

const result = await paicku.builder.suggest()
console.log(result.stdout)
```

### Download the SBOM

CLI:

```sh
paicku sbom download my-containerized-app:latest --output-dir ./sbom
```

Node.js:

```javascript
const paicku = createPaicku()

await paicku.sbom.download('my-containerized-app:latest', {
  'output-dir': './sbom',
})
```

## Contributing

Contributions are welcome, feel free to open an issue or a pull request.

### Development

```sh
npm install
```

Run the CLI against source:

```sh
./bin/dev.js build test/integration/testdata/nodejs_simple_app --container-runtime podman
```

Production mode needs a build first:

```sh
npm run build
./bin/run.js
```

Rebuild after changing source.

### Testing

```sh
npm run test
```

Integration tests (require Docker or Podman):

```sh
npm run integration:test:podman
npm run integration:test:docker
```

Debug unit tests (`--timeout 0`, useful with `.only`):

```sh
npm run unit:test:debug
```

Coverage:

```sh
npm run test:report
```
