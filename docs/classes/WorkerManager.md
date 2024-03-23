[opfsdb](../README.md) / [Exports](../modules.md) / WorkerManager

# Class: WorkerManager

## Table of contents

### Constructors

- [constructor](WorkerManager.md#constructor)

### Properties

- [instance](WorkerManager.md#instance)
- [mode](WorkerManager.md#mode)
- [sharedWorkerUrl](WorkerManager.md#sharedworkerurl)
- [workerUrl](WorkerManager.md#workerurl)

### Methods

- [getWorker](WorkerManager.md#getworker)
- [sendCommand](WorkerManager.md#sendcommand)

## Constructors

### constructor

• **new WorkerManager**(`workerUrl`, `sharedWorkerUrl`, `mode?`): [`WorkerManager`](WorkerManager.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `workerUrl` | `string` | `undefined` |
| `sharedWorkerUrl` | `string` | `undefined` |
| `mode` | ``"classic"`` \| ``"module"`` | `'module'` |

#### Returns

[`WorkerManager`](WorkerManager.md)

#### Defined in

[lib/WorkerManager.ts:7](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L7)

## Properties

### instance

• `Private` **instance**: `Worker`

#### Defined in

[lib/WorkerManager.ts:5](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L5)

___

### mode

• `Private` **mode**: ``"classic"`` \| ``"module"`` = `'module'`

#### Defined in

[lib/WorkerManager.ts:10](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L10)

___

### sharedWorkerUrl

• `Private` **sharedWorkerUrl**: `string`

#### Defined in

[lib/WorkerManager.ts:9](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L9)

___

### workerUrl

• `Private` **workerUrl**: `string`

#### Defined in

[lib/WorkerManager.ts:8](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L8)

## Methods

### getWorker

▸ **getWorker**(): `Worker`

#### Returns

`Worker`

#### Defined in

[lib/WorkerManager.ts:13](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L13)

___

### sendCommand

▸ **sendCommand**\<`Command`, `ReturnType`\>(`command`): `Promise`\<`void` \| `string`[] \| `ReturnType` \| `ReturnType`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Command` | extends [`ICommandInputs`](../modules.md#icommandinputs)\<`ReturnType`\> |
| `ReturnType` | extends [`IBasicRecord`](../modules.md#ibasicrecord) = [`IBasicRecord`](../modules.md#ibasicrecord) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | `Command` |

#### Returns

`Promise`\<`void` \| `string`[] \| `ReturnType` \| `ReturnType`[]\>

#### Defined in

[lib/WorkerManager.ts:27](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/WorkerManager.ts#L27)
