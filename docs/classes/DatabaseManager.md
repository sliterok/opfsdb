[opfsdb](../README.md) / [Exports](../modules.md) / DatabaseManager

# Class: DatabaseManager

## Table of contents

### Constructors

- [constructor](DatabaseManager.md#constructor)

### Properties

- [commandHandlers](DatabaseManager.md#commandhandlers)
- [tables](DatabaseManager.md#tables)

### Methods

- [createTable](DatabaseManager.md#createtable)
- [delete](DatabaseManager.md#delete)
- [drop](DatabaseManager.md#drop)
- [executeCommand](DatabaseManager.md#executecommand)
- [import](DatabaseManager.md#import)
- [insert](DatabaseManager.md#insert)
- [query](DatabaseManager.md#query)
- [read](DatabaseManager.md#read)
- [readMany](DatabaseManager.md#readmany)
- [unloadTables](DatabaseManager.md#unloadtables)

## Constructors

### constructor

• **new DatabaseManager**(): [`DatabaseManager`](DatabaseManager.md)

#### Returns

[`DatabaseManager`](DatabaseManager.md)

#### Defined in

[lib/DatabaseManager.ts:19](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L19)

## Properties

### commandHandlers

• `Private` **commandHandlers**: `Record`\<`string`, \<CMD\>(`command`: `CMD`) => `Promise`\<`void` \| `any`[] \| `string`[]\>\>

#### Defined in

[lib/DatabaseManager.ts:76](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L76)

___

### tables

• `Private` **tables**: `Record`\<`string`, [`OPFSDB`](OPFSDB.md)\<`any`\>\> = `{}`

#### Defined in

[lib/DatabaseManager.ts:17](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L17)

## Methods

### createTable

▸ **createTable**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ICreateTableInput`](../interfaces/ICreateTableInput.md) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:21](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L21)

___

### delete

▸ **delete**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IDeleteInput`](../interfaces/IDeleteInput.md) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:40](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L40)

___

### drop

▸ **drop**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IDropInput`](../interfaces/IDropInput.md) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:52](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L52)

___

### executeCommand

▸ **executeCommand**\<`T`\>(`command`): `Promise`\<`void` \| `string`[] \| `T`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | [`ICommandInputs`](../modules.md#icommandinputs)\<`T`\> |

#### Returns

`Promise`\<`void` \| `string`[] \| `T`[]\>

#### Defined in

[lib/DatabaseManager.ts:63](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L63)

___

### import

▸ **import**\<`T`\>(`«destructured»`): `Promise`\<`void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IImportInput`](../interfaces/IImportInput.md)\<`T`\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:36](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L36)

___

### insert

▸ **insert**\<`T`\>(`«destructured»`): `Promise`\<`void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IInsertInput`](../interfaces/IInsertInput.md)\<`T`\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:32](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L32)

___

### query

▸ **query**\<`T`\>(`input`): `Promise`\<`string`[] \| `T`[]\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`IQueryInput`](../interfaces/IQueryInput.md)\<[`IBasicRecord`](../modules.md#ibasicrecord)\> |

#### Returns

`Promise`\<`string`[] \| `T`[]\>

#### Defined in

[lib/DatabaseManager.ts:28](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L28)

___

### read

▸ **read**\<`T`\>(`«destructured»`): `Promise`\<`T`[]\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IReadInput`](../interfaces/IReadInput.md) |

#### Returns

`Promise`\<`T`[]\>

#### Defined in

[lib/DatabaseManager.ts:44](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L44)

___

### readMany

▸ **readMany**\<`T`\>(`«destructured»`): `Promise`\<`T`[]\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IReadManyInput`](../interfaces/IReadManyInput.md) |

#### Returns

`Promise`\<`T`[]\>

#### Defined in

[lib/DatabaseManager.ts:48](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L48)

___

### unloadTables

▸ **unloadTables**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/DatabaseManager.ts:58](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/DatabaseManager.ts#L58)
