[opfsdb](../README.md) / [Exports](../modules.md) / IEncoder

# Interface: IEncoder

## Hierarchy

- `Encoder`

  ↳ **`IEncoder`**

## Table of contents

### Properties

- [decodeKeys](IEncoder.md#decodekeys)

### Methods

- [decode](IEncoder.md#decode)
- [decodeMultiple](IEncoder.md#decodemultiple)
- [encode](IEncoder.md#encode)

## Properties

### decodeKeys

• **decodeKeys**: (`tag`: `any`) => `any`

#### Type declaration

▸ (`tag`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `tag` | `any` |

##### Returns

`any`

#### Defined in

[lib/types.ts:83](https://github.com/sliterok/opfsdb/blob/96fe35f/lib/types.ts#L83)

## Methods

### decode

▸ **decode**(`messagePack`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messagePack` | `Uint8Array` \| `Buffer` |

#### Returns

`any`

#### Inherited from

Encoder.decode

#### Defined in

node_modules/.pnpm/cbor-x@1.5.8/node_modules/cbor-x/index.d.ts:43

___

### decodeMultiple

▸ **decodeMultiple**(`messagePack`, `forEach?`): `void` \| []

#### Parameters

| Name | Type |
| :------ | :------ |
| `messagePack` | `Uint8Array` \| `Buffer` |
| `forEach?` | (`value`: `any`) => `any` |

#### Returns

`void` \| []

#### Inherited from

Encoder.decodeMultiple

#### Defined in

node_modules/.pnpm/cbor-x@1.5.8/node_modules/cbor-x/index.d.ts:44

___

### encode

▸ **encode**(`value`): `Buffer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |

#### Returns

`Buffer`

#### Inherited from

Encoder.encode

#### Defined in

node_modules/.pnpm/cbor-x@1.5.8/node_modules/cbor-x/index.d.ts:54
