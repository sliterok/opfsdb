[opfsdb](../README.md) / [Exports](../modules.md) / DedicatedWorkerController

# Class: DedicatedWorkerController

## Table of contents

### Constructors

- [constructor](DedicatedWorkerController.md#constructor)

### Properties

- [databaseManager](DedicatedWorkerController.md#databasemanager)
- [isMaster](DedicatedWorkerController.md#ismaster)
- [masterStarted](DedicatedWorkerController.md#masterstarted)
- [sharedWorkerPort](DedicatedWorkerController.md#sharedworkerport)

### Methods

- [executeCommand](DedicatedWorkerController.md#executecommand)
- [handleClosing](DedicatedWorkerController.md#handleclosing)
- [handleCommand](DedicatedWorkerController.md#handlecommand)
- [handleSharedWorkerMessage](DedicatedWorkerController.md#handlesharedworkermessage)
- [initializeMessageHandler](DedicatedWorkerController.md#initializemessagehandler)
- [queryCommand](DedicatedWorkerController.md#querycommand)
- [setupSharedWorkerPort](DedicatedWorkerController.md#setupsharedworkerport)
- [startMaster](DedicatedWorkerController.md#startmaster)
- [stopMaster](DedicatedWorkerController.md#stopmaster)

## Constructors

### constructor

• **new DedicatedWorkerController**(): [`DedicatedWorkerController`](DedicatedWorkerController.md)

#### Returns

[`DedicatedWorkerController`](DedicatedWorkerController.md)

#### Defined in

[lib/workers/DedicatedWorkerController.ts:11](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L11)

## Properties

### databaseManager

• `Private` **databaseManager**: [`DatabaseManager`](DatabaseManager.md)

#### Defined in

[lib/workers/DedicatedWorkerController.ts:9](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L9)

___

### isMaster

• `Private` **isMaster**: `boolean` = `false`

#### Defined in

[lib/workers/DedicatedWorkerController.ts:6](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L6)

___

### masterStarted

• `Private` **masterStarted**: `void` \| `Promise`\<`void`\> = `undefined`

#### Defined in

[lib/workers/DedicatedWorkerController.ts:7](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L7)

___

### sharedWorkerPort

• `Private` **sharedWorkerPort**: `void` \| `MessagePort` = `undefined`

#### Defined in

[lib/workers/DedicatedWorkerController.ts:8](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L8)

## Methods

### executeCommand

▸ **executeCommand**(`data`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`ICommandInputs`](../modules.md#icommandinputs) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:77](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L77)

___

### handleClosing

▸ **handleClosing**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:45](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L45)

___

### handleCommand

▸ **handleCommand**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `command` | [`ICommandInputs`](../modules.md#icommandinputs) |
| › `port` | `MessagePort` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:67](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L67)

___

### handleSharedWorkerMessage

▸ **handleSharedWorkerMessage**(`event`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `MessageEvent`\<`any`\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:56](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L56)

___

### initializeMessageHandler

▸ **initializeMessageHandler**(): `void`

#### Returns

`void`

#### Defined in

[lib/workers/DedicatedWorkerController.ts:24](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L24)

___

### queryCommand

▸ **queryCommand**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `command` | [`ICommandInputs`](../modules.md#icommandinputs) |
| › `port` | `MessagePort` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:87](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L87)

___

### setupSharedWorkerPort

▸ **setupSharedWorkerPort**(`port`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `MessagePort` |

#### Returns

`void`

#### Defined in

[lib/workers/DedicatedWorkerController.ts:50](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L50)

___

### startMaster

▸ **startMaster**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:16](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L16)

___

### stopMaster

▸ **stopMaster**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/workers/DedicatedWorkerController.ts:20](https://github.com/sliterok/opfsdb/blob/dev/lib/workers/DedicatedWorkerController.ts#L20)
