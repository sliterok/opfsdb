[opfsdb](README.md) / Exports

# opfsdb

## Table of contents

### Classes

- [DatabaseManager](classes/DatabaseManager.md)
- [DedicatedWorkerController](classes/DedicatedWorkerController.md)
- [FileStoreStrategy](classes/FileStoreStrategy.md)
- [OPFSDB](classes/OPFSDB.md)
- [SharedWorkerController](classes/SharedWorkerController.md)
- [WorkerManager](classes/WorkerManager.md)

### Interfaces

- [IBaseInput](interfaces/IBaseInput.md)
- [ICreateTableInput](interfaces/ICreateTableInput.md)
- [IDeleteInput](interfaces/IDeleteInput.md)
- [IDropInput](interfaces/IDropInput.md)
- [IEncoder](interfaces/IEncoder.md)
- [IImportInput](interfaces/IImportInput.md)
- [IInsertInput](interfaces/IInsertInput.md)
- [IInsertOptions](interfaces/IInsertOptions.md)
- [IQueryInput](interfaces/IQueryInput.md)
- [IQueryOptions](interfaces/IQueryOptions.md)
- [IReadInput](interfaces/IReadInput.md)
- [IReadManyInput](interfaces/IReadManyInput.md)
- [IRecordKey](interfaces/IRecordKey.md)
- [IUnloadInput](interfaces/IUnloadInput.md)

### Type Aliases

- [IBasicRecord](modules.md#ibasicrecord)
- [ICommandInputs](modules.md#icommandinputs)
- [ITableKeys](modules.md#itablekeys)

## Type Aliases

### IBasicRecord

Ƭ **IBasicRecord**: `Object`

#### Index signature

▪ [key: `string`]: `any`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Defined in

[lib/types.ts:77](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L77)

___

### ICommandInputs

Ƭ **ICommandInputs**\<`T`\>: [`ICreateTableInput`](interfaces/ICreateTableInput.md) \| [`IQueryInput`](interfaces/IQueryInput.md)\<`T`\> \| [`IInsertInput`](interfaces/IInsertInput.md)\<`T`\> \| [`IDeleteInput`](interfaces/IDeleteInput.md) \| [`IReadInput`](interfaces/IReadInput.md) \| [`IReadManyInput`](interfaces/IReadManyInput.md) \| [`IDropInput`](interfaces/IDropInput.md) \| [`IImportInput`](interfaces/IImportInput.md) \| [`IUnloadInput`](interfaces/IUnloadInput.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](modules.md#ibasicrecord) \| `never` = [`IBasicRecord`](modules.md#ibasicrecord) |

#### Defined in

[lib/types.ts:66](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L66)

___

### ITableKeys

Ƭ **ITableKeys**: `Record`\<`string`, [`IRecordKey`](interfaces/IRecordKey.md)\>

#### Defined in

[lib/types.ts:9](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L9)
