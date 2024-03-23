[opfsdb](../README.md) / [Exports](../modules.md) / IQueryInput

# Interface: IQueryInput\<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) = [`IBasicRecord`](../modules.md#ibasicrecord) |

## Hierarchy

- [`IBaseInput`](IBaseInput.md)

- [`IQueryOptions`](IQueryOptions.md)

  ↳ **`IQueryInput`**

## Table of contents

### Properties

- [isAnd](IQueryInput.md#isand)
- [keys](IQueryInput.md#keys)
- [limit](IQueryInput.md#limit)
- [name](IQueryInput.md#name)
- [query](IQueryInput.md#query)
- [tableName](IQueryInput.md#tablename)

## Properties

### isAnd

• `Optional` **isAnd**: `boolean`

#### Inherited from

[IQueryOptions](IQueryOptions.md).[isAnd](IQueryOptions.md#isand)

#### Defined in

[lib/types.ts:28](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L28)

___

### keys

• `Optional` **keys**: `boolean`

#### Inherited from

[IQueryOptions](IQueryOptions.md).[keys](IQueryOptions.md#keys)

#### Defined in

[lib/types.ts:30](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L30)

___

### limit

• `Optional` **limit**: `number`

#### Inherited from

[IQueryOptions](IQueryOptions.md).[limit](IQueryOptions.md#limit)

#### Defined in

[lib/types.ts:29](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L29)

___

### name

• **name**: ``"query"``

#### Defined in

[lib/types.ts:34](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L34)

___

### query

• **query**: \{ [key in string \| number \| symbol]?: Partial\<Object\> }

#### Defined in

[lib/types.ts:35](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L35)

___

### tableName

• **tableName**: `string`

#### Inherited from

[IBaseInput](IBaseInput.md).[tableName](IBaseInput.md#tablename)

#### Defined in

[lib/types.ts:11](https://github.com/sliterok/opfsdb/blob/dev/lib/types.ts#L11)
