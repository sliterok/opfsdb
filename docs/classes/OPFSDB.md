[opfsdb](../README.md) / [Exports](../modules.md) / OPFSDB

# Class: OPFSDB\<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) |

## Table of contents

### Constructors

- [constructor](OPFSDB.md#constructor)

### Properties

- [defaultKey](OPFSDB.md#defaultkey)
- [encoder](OPFSDB.md#encoder)
- [handles](OPFSDB.md#handles)
- [holesIndex](OPFSDB.md#holesindex)
- [keys](OPFSDB.md#keys)
- [lastIndex](OPFSDB.md#lastindex)
- [order](OPFSDB.md#order)
- [recordsIndex](OPFSDB.md#recordsindex)
- [recordsRoot](OPFSDB.md#recordsroot)
- [root](OPFSDB.md#root)
- [tableName](OPFSDB.md#tablename)
- [trees](OPFSDB.md#trees)

### Methods

- [cleanupHole](OPFSDB.md#cleanuphole)
- [createOrFindHandle](OPFSDB.md#createorfindhandle)
- [decodeLocation](OPFSDB.md#decodelocation)
- [delete](OPFSDB.md#delete)
- [drop](OPFSDB.md#drop)
- [encodeLocation](OPFSDB.md#encodelocation)
- [getHole](OPFSDB.md#gethole)
- [import](OPFSDB.md#import)
- [init](OPFSDB.md#init)
- [insert](OPFSDB.md#insert)
- [query](OPFSDB.md#query)
- [read](OPFSDB.md#read)
- [readFile](OPFSDB.md#readfile)
- [readMany](OPFSDB.md#readmany)
- [unload](OPFSDB.md#unload)
- [writeFile](OPFSDB.md#writefile)

## Constructors

### constructor

• **new OPFSDB**\<`T`\>(`tableName`, `keys?`, `order?`, `defaultKey?`): [`OPFSDB`](OPFSDB.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `tableName` | `string` | `undefined` |
| `keys?` | [`ITableKeys`](../modules.md#itablekeys) | `undefined` |
| `order` | `number` | `25` |
| `defaultKey` | `undefined` \| `string` | `undefined` |

#### Returns

[`OPFSDB`](OPFSDB.md)\<`T`\>

#### Defined in

[lib/OPFSDB.ts:18](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L18)

## Properties

### defaultKey

• `Private` **defaultKey**: `undefined` \| `string`

#### Defined in

[lib/OPFSDB.ts:22](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L22)

___

### encoder

• `Private` **encoder**: [`IEncoder`](../interfaces/IEncoder.md)

#### Defined in

[lib/OPFSDB.ts:14](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L14)

___

### handles

• `Private` **handles**: `Map`\<`FileSystemDirectoryHandle`, `Map`\<`string`, `FileSystemSyncAccessHandle`\>\>

#### Defined in

[lib/OPFSDB.ts:16](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L16)

___

### holesIndex

• `Private` **holesIndex**: `BPTreeAsync`\<`number`, `number`\>

#### Defined in

[lib/OPFSDB.ts:10](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L10)

___

### keys

• `Private` `Optional` **keys**: [`ITableKeys`](../modules.md#itablekeys)

#### Defined in

[lib/OPFSDB.ts:20](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L20)

___

### lastIndex

• `Private` **lastIndex**: `number`

#### Defined in

[lib/OPFSDB.ts:15](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L15)

___

### order

• `Private` **order**: `number` = `25`

#### Defined in

[lib/OPFSDB.ts:21](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L21)

___

### recordsIndex

• `Private` **recordsIndex**: `BPTreeAsync`\<`Uint8Array`, `string`\>

#### Defined in

[lib/OPFSDB.ts:9](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L9)

___

### recordsRoot

• `Private` **recordsRoot**: `FileSystemDirectoryHandle`

#### Defined in

[lib/OPFSDB.ts:13](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L13)

___

### root

• `Private` **root**: `FileSystemDirectoryHandle`

#### Defined in

[lib/OPFSDB.ts:12](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L12)

___

### tableName

• `Private` **tableName**: `string`

#### Defined in

[lib/OPFSDB.ts:19](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L19)

___

### trees

• `Private` **trees**: `Record`\<`string`, `BPTreeAsync`\<`string`, `string` \| `number`\>\> = `{}`

#### Defined in

[lib/OPFSDB.ts:11](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L11)

## Methods

### cleanupHole

▸ **cleanupHole**(`hole`, `encodedLength`, `encodedEndIndex`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hole` | `void` \| [`number`, `number`] |
| `encodedLength` | `number` |
| `encodedEndIndex` | `number` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:139](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L139)

___

### createOrFindHandle

▸ **createOrFindHandle**(`dir`, `fileName`, `create?`): `Promise`\<`FileSystemSyncAccessHandle`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `dir` | `FileSystemDirectoryHandle` | `undefined` |
| `fileName` | `string` | `undefined` |
| `create` | `boolean` | `false` |

#### Returns

`Promise`\<`FileSystemSyncAccessHandle`\>

#### Defined in

[lib/OPFSDB.ts:278](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L278)

___

### decodeLocation

▸ **decodeLocation**(`val?`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `Uint8Array` |

#### Returns

`number`[]

#### Defined in

[lib/OPFSDB.ts:300](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L300)

___

### delete

▸ **delete**(`id`, `oldRecord?`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `oldRecord?` | `T` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:242](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L242)

___

### drop

▸ **drop**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:258](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L258)

___

### encodeLocation

▸ **encodeLocation**(`at`, `length`): `Uint8Array`

#### Parameters

| Name | Type |
| :------ | :------ |
| `at` | `number` |
| `length` | `number` |

#### Returns

`Uint8Array`

#### Defined in

[lib/OPFSDB.ts:296](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L296)

___

### getHole

▸ **getHole**(`size`): `Promise`\<`void` \| [`number`, `number`]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `size` | `number` |

#### Returns

`Promise`\<`void` \| [`number`, `number`]\>

#### Defined in

[lib/OPFSDB.ts:130](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L130)

___

### import

▸ **import**(`records`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | \{ `id`: `string` ; `value`: `T`  }[] |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:149](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L149)

___

### init

▸ **init**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:25](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L25)

___

### insert

▸ **insert**(`id`, `value`, `fullRecord?`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `value` | `T` |
| `fullRecord?` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:175](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L175)

___

### query

▸ **query**(`queries`, `options?`): `Promise`\<`string`[] \| `T`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queries` | \{ [key in string \| number \| symbol]?: Partial\<Object\> } |
| `options?` | [`IQueryOptions`](../interfaces/IQueryOptions.md) |

#### Returns

`Promise`\<`string`[] \| `T`[]\>

#### Defined in

[lib/OPFSDB.ts:71](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L71)

___

### read

▸ **read**(`id`): `Promise`\<`void` \| `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`Promise`\<`void` \| `T`\>

#### Defined in

[lib/OPFSDB.ts:122](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L122)

___

### readFile

▸ **readFile**(`dir`, `fileName`, `from?`, `encoder?`, `to?`): `Promise`\<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `dir` | `FileSystemDirectoryHandle` | `undefined` |
| `fileName` | `string` | `undefined` |
| `from` | `number` | `0` |
| `encoder?` | ``false`` \| [`IEncoder`](../interfaces/IEncoder.md) | `undefined` |
| `to?` | `number` | `undefined` |

#### Returns

`Promise`\<`any`\>

#### Defined in

[lib/OPFSDB.ts:305](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L305)

___

### readMany

▸ **readMany**(`ids`): `Promise`\<`T`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `ids` | `string`[] |

#### Returns

`Promise`\<`T`[]\>

#### Defined in

[lib/OPFSDB.ts:109](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L109)

___

### unload

▸ **unload**(): `void`

#### Returns

`void`

#### Defined in

[lib/OPFSDB.ts:268](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L268)

___

### writeFile

▸ **writeFile**(`dir`, `fileName`, `data`, `encoder?`, `at?`, `pageSize?`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `dir` | `FileSystemDirectoryHandle` | `undefined` |
| `fileName` | `string` | `undefined` |
| `data` | `Record`\<`string`, `any`\> \| `Uint8Array` | `undefined` |
| `encoder?` | ``false`` \| [`IEncoder`](../interfaces/IEncoder.md) | `undefined` |
| `at` | `number` | `0` |
| `pageSize?` | `number` | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/OPFSDB.ts:341](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/OPFSDB.ts#L341)
