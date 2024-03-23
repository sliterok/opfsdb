[opfsdb](../README.md) / [Exports](../modules.md) / SharedWorkerController

# Class: SharedWorkerController

## Table of contents

### Constructors

- [constructor](SharedWorkerController.md#constructor)

### Properties

- [masterPort](SharedWorkerController.md#masterport)
- [ports](SharedWorkerController.md#ports)

### Methods

- [handlePortMessage](SharedWorkerController.md#handleportmessage)
- [migrateMaster](SharedWorkerController.md#migratemaster)
- [queryMaster](SharedWorkerController.md#querymaster)
- [setupConnectionHandler](SharedWorkerController.md#setupconnectionhandler)

## Constructors

### constructor

• **new SharedWorkerController**(): [`SharedWorkerController`](SharedWorkerController.md)

#### Returns

[`SharedWorkerController`](SharedWorkerController.md)

#### Defined in

[lib/workers/SharedWorkerController.ts:7](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L7)

## Properties

### masterPort

• `Private` **masterPort**: `void` \| `MessagePort` = `undefined`

#### Defined in

[lib/workers/SharedWorkerController.ts:5](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L5)

___

### ports

• `Private` **ports**: `Set`\<`MessagePort`\>

#### Defined in

[lib/workers/SharedWorkerController.ts:4](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L4)

## Methods

### handlePortMessage

▸ **handlePortMessage**(`event`, `port`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `MessageEvent`\<`any`\> |
| `port` | `MessagePort` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/SharedWorkerController.ts:44](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L44)

___

### migrateMaster

▸ **migrateMaster**(): `void`

#### Returns

`void`

#### Defined in

[lib/workers/SharedWorkerController.ts:11](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L11)

___

### queryMaster

▸ **queryMaster**(`command`, `responsePort`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | [`ICommandInputs`](../modules.md#icommandinputs) |
| `responsePort` | `MessagePort` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/SharedWorkerController.ts:19](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L19)

___

### setupConnectionHandler

▸ **setupConnectionHandler**(): `void`

#### Returns

`void`

#### Defined in

[lib/workers/SharedWorkerController.ts:29](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/workers/SharedWorkerController.ts#L29)
