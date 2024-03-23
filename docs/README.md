opfsdb / [Exports](modules.md)

# OPFSDB

OPFSDB (Origin Private File System Database) is a TypeScript library that provides a lightweight and efficient in-browser database solution using the File System Access API and Web Workers. It utilizes the B+ Tree data structure from the [serializable-bptree](https://github.com/izure1/serializable-bptree) library for indexing and querying data, allowing for fast and scalable storage and retrieval of records.

## Table of Contents

-   [Features](#features)
-   [Architecture](#architecture)
-   [Installation](#installation)
-   [Usage](#usage)
    -   [Main Thread](#main-thread)
    -   [Shared Worker](#shared-worker)
    -   [Web Worker](#web-worker)
-   [Documentation](#docs)

## Features

-   **File System Access API**: OPFSDB uses the File System Access API to create a private, sandboxed database for your application, ensuring data privacy and security.
-   **Web Workers**: Utilizes Web Workers to allow for sync OPFS API that drastically improves read and write performance.
-   **Shared Worker API**: OPFSDB leverages the Shared Worker API to enable communication between multiple Web Workers, allowing for multi-tab interaction with one database.
-   **Efficient Indexing**: OPFSDB uses [serializable-bptree](https://github.com/izure1/serializable-bptree), a high-performance B+ Tree implementation, for indexing and querying data.
-   **TypeScript Support**: Written in TypeScript for better type safety and developer experience.
-   **Encoding/Decoding**: OPFSDB encodes data in CBOR format using [cbor-x](https://github.com/kriszyp/cbor-x) library, also storing the structures alongside.

## Architecture

OPFSDB has three main entry points:

1. **Main Page Code**: This is the code that runs in the main browser context. It is responsible for initializing WorkerManager and interacting with the database through the `sendCommand` method.

2. **Shared Worker**: This is a special type of Web Worker that can be shared across multiple browser contexts. It acts as a communication bridge between the main page code and the dedicated Web Workers.

3. **Dedicated Web Workers**: These are the actual workers that perform the database operations. They can either execute queries directly or communicate with a master worker through the shared worker.

## Installation

```bash
npm install opfsdb
```

```bash
pnpm add opfsdb
```

```bash
yarn add opfsdb
```

## Getting Started

### Main Thread

In your main application code, you can interact with OPFSDB using the `sendCommand` method from the `WorkerManager` class:

```typescript
import { WorkerManager } from 'opfsdb/WorkerManager'

const workerManager = new WorkerManager('worker.js', 'shared-worker.js')

// Send a command to create a new table
workerManager.sendCommand({
	name: 'createTable',
	tableName: 'users',
	keys: {
		id: { type: 'string', indexed: true },
		name: { type: 'string' },
		age: { type: 'number' },
	},
})

// Insert data into the table
workerManager.sendCommand({
	name: 'insert',
	tableName: 'users',
	record: { id: '1', name: 'John Doe', age: 30 },
})

// Query data from the table
workerManager
	.sendCommand({
		name: 'query',
		tableName: 'users',
		query: { age: { $gte: 25 } },
	})
	.then(results => {
		console.log('Query results:', results)
	})
```

### Shared Worker

The Shared Worker acts as a communication channel between different Web Workers. It connects with each Web Worker and tracks the master one, when one of the slave Web Workers receives a command from the Main Thread, it will communicate with the master Web Worker through the Shared Web Worker.  
You can create a new Shared Worker file (`shared-worker.js`) and import the `SharedWorkerController` class from OPFSDB:

```javascript
import { SharedWorkerController } from 'opfsdb/workers/SharedWorkerController'
const sharedWorkerController = new SharedWorkerController()
```

### Web Worker

The Web Workers handle the actual execution of commands. They receive commands from the Main thread and, depending on whether it's the master Worker or not, they will either execute the command and return the results or send the command to the Shared Worker.  
You can create a new Web Worker file (`worker.js`) and import the `DedicatedWorkerController` class from OPFSDB:

```javascript
import { DedicatedWorkerController } from 'opfsdb/workers/DedicatedWorkerController'
const dedicatedWorkerController = new DedicatedWorkerController()
```

## Docs

You can find typedoc in the docs folder [Here](/docs/modules.md)
