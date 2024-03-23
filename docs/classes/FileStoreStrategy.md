[opfsdb](../README.md) / [Exports](../modules.md) / FileStoreStrategy

# Class: FileStoreStrategy\<K, V\>

## Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Hierarchy

- `SerializeStrategyAsync`\<`K`, `V`\>

  ↳ **`FileStoreStrategy`**

## Table of contents

### Constructors

- [constructor](FileStoreStrategy.md#constructor)

### Properties

- [encoder](FileStoreStrategy.md#encoder)
- [head](FileStoreStrategy.md#head)
- [indexName](FileStoreStrategy.md#indexname)
- [lastHead](FileStoreStrategy.md#lasthead)
- [order](FileStoreStrategy.md#order)
- [pageSize](FileStoreStrategy.md#pagesize)
- [parent](FileStoreStrategy.md#parent)
- [root](FileStoreStrategy.md#root)
- [writeHeadTimeout](FileStoreStrategy.md#writeheadtimeout)

### Methods

- [autoIncrement](FileStoreStrategy.md#autoincrement)
- [getHeadData](FileStoreStrategy.md#getheaddata)
- [id](FileStoreStrategy.md#id)
- [read](FileStoreStrategy.md#read)
- [readHead](FileStoreStrategy.md#readhead)
- [setHeadData](FileStoreStrategy.md#setheaddata)
- [write](FileStoreStrategy.md#write)
- [writeHead](FileStoreStrategy.md#writehead)

## Constructors

### constructor

• **new FileStoreStrategy**\<`K`, `V`\>(`order`, `root`, `encoder`, `indexName`, `parent`, `pageSize?`): [`FileStoreStrategy`](FileStoreStrategy.md)\<`K`, `V`\>

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `order` | `number` | `undefined` |
| `root` | `FileSystemDirectoryHandle` | `undefined` |
| `encoder` | [`IEncoder`](../interfaces/IEncoder.md) | `undefined` |
| `indexName` | `string` | `undefined` |
| `parent` | [`OPFSDB`](OPFSDB.md)\<`any`\> | `undefined` |
| `pageSize` | `number` | `65536` |

#### Returns

[`FileStoreStrategy`](FileStoreStrategy.md)\<`K`, `V`\>

#### Overrides

SerializeStrategyAsync\&lt;K, V\&gt;.constructor

#### Defined in

[lib/Strategy.ts:9](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L9)

## Properties

### encoder

• `Private` **encoder**: [`IEncoder`](../interfaces/IEncoder.md)

#### Defined in

[lib/Strategy.ts:12](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L12)

___

### head

• **head**: `SerializeStrategyHead`

#### Inherited from

SerializeStrategyAsync.head

#### Defined in

node_modules/.pnpm/serializable-bptree@3.2.2/node_modules/serializable-bptree/dist/typings/base/SerializeStrategy.d.ts:11

___

### indexName

• `Private` **indexName**: `string`

#### Defined in

[lib/Strategy.ts:13](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L13)

___

### lastHead

• `Private` `Optional` **lastHead**: `SerializeStrategyHead`

#### Defined in

[lib/Strategy.ts:6](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L6)

___

### order

• `Readonly` **order**: `number`

#### Inherited from

SerializeStrategyAsync.order

#### Defined in

node_modules/.pnpm/serializable-bptree@3.2.2/node_modules/serializable-bptree/dist/typings/base/SerializeStrategy.d.ts:10

___

### pageSize

• `Private` **pageSize**: `number` = `65536`

#### Defined in

[lib/Strategy.ts:15](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L15)

___

### parent

• `Private` **parent**: [`OPFSDB`](OPFSDB.md)\<`any`\>

#### Defined in

[lib/Strategy.ts:14](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L14)

___

### root

• `Private` **root**: `FileSystemDirectoryHandle`

#### Defined in

[lib/Strategy.ts:11](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L11)

___

### writeHeadTimeout

• `Private` `Optional` **writeHeadTimeout**: `Timeout`

#### Defined in

[lib/Strategy.ts:7](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L7)

## Methods

### autoIncrement

▸ **autoIncrement**(`key`, `defaultValue`): `Promise`\<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `defaultValue` | `number` |

#### Returns

`Promise`\<`number`\>

#### Inherited from

SerializeStrategyAsync.autoIncrement

#### Defined in

node_modules/.pnpm/serializable-bptree@3.2.2/node_modules/serializable-bptree/dist/typings/SerializeStrategyAsync.d.ts:12

___

### getHeadData

▸ **getHeadData**(`key`, `defaultValue`): `Promise`\<`Json`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `defaultValue` | `Json` |

#### Returns

`Promise`\<`Json`\>

#### Inherited from

SerializeStrategyAsync.getHeadData

#### Defined in

node_modules/.pnpm/serializable-bptree@3.2.2/node_modules/serializable-bptree/dist/typings/SerializeStrategyAsync.d.ts:10

___

### id

▸ **id**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

#### Overrides

SerializeStrategyAsync.id

#### Defined in

[lib/Strategy.ts:20](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L20)

___

### read

▸ **read**(`index?`): `Promise`\<`BPTreeNode`\<`K`, `V`\>\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `index` | `number` | `0` |

#### Returns

`Promise`\<`BPTreeNode`\<`K`, `V`\>\>

#### Overrides

SerializeStrategyAsync.read

#### Defined in

[lib/Strategy.ts:24](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L24)

___

### readHead

▸ **readHead**(): `Promise`\<``null`` \| `SerializeStrategyHead`\>

#### Returns

`Promise`\<``null`` \| `SerializeStrategyHead`\>

#### Overrides

SerializeStrategyAsync.readHead

#### Defined in

[lib/Strategy.ts:33](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L33)

___

### setHeadData

▸ **setHeadData**(`key`, `data`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `data` | `Json` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

SerializeStrategyAsync.setHeadData

#### Defined in

node_modules/.pnpm/serializable-bptree@3.2.2/node_modules/serializable-bptree/dist/typings/SerializeStrategyAsync.d.ts:11

___

### write

▸ **write**(`index?`, `node`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `index` | `number` | `0` |
| `node` | `BPTreeNode`\<`K`, `V`\> | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Overrides

SerializeStrategyAsync.write

#### Defined in

[lib/Strategy.ts:29](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L29)

___

### writeHead

▸ **writeHead**(`head`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `head` | `SerializeStrategyHead` |

#### Returns

`Promise`\<`void`\>

#### Overrides

SerializeStrategyAsync.writeHead

#### Defined in

[lib/Strategy.ts:42](https://github.com/sliterok/opfsdb/blob/bc134c9/lib/Strategy.ts#L42)
