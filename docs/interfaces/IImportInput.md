[opfsdb](../README.md) / [Exports](../modules.md) / IImportInput

# Interface: IImportInput\<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IBasicRecord`](../modules.md#ibasicrecord) = [`IBasicRecord`](../modules.md#ibasicrecord) |

## Hierarchy

- [`IBaseInput`](IBaseInput.md)

  ↳ **`IImportInput`**

## Table of contents

### Properties

- [name](IImportInput.md#name)
- [records](IImportInput.md#records)
- [tableName](IImportInput.md#tablename)

## Properties

### name

• **name**: ``"import"``

#### Defined in

[lib/types.ts:23](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L23)

___

### records

• **records**: `T`[]

#### Defined in

[lib/types.ts:24](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L24)

___

### tableName

• **tableName**: `string`

#### Inherited from

[IBaseInput](IBaseInput.md).[tableName](IBaseInput.md#tablename)

#### Defined in

[lib/types.ts:11](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L11)
