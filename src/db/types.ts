import { Encoder } from 'cbor-x'
import { BPTreeCondition } from 'serializable-bptree/dist/typings/base/BPTree'

export interface IRecordKey {
	indexed?: boolean
	type: 'string' | 'number'
}

export type ITableKeys = Record<string, IRecordKey>
export interface IBaseInput {
	tableName: string
}

export interface IInsertOptions {
	fullRecord?: boolean
}
export interface IInsertInput<T extends IBasicRecord = IBasicRecord> extends IInsertOptions, IBaseInput {
	name: 'insert'
	record: T
}

export interface IImportInput<T extends IBasicRecord = IBasicRecord> extends IBaseInput {
	name: 'import'
	records: T[]
}

export interface IQueryOptions {
	isAnd?: boolean
	limit?: number
	keys?: boolean
}

export interface IQueryInput<T extends IBasicRecord = IBasicRecord> extends IBaseInput, IQueryOptions {
	name: 'query'
	query: {
		[key in keyof T]?: BPTreeCondition<string | number> | never
	}
}
export interface ICreateTableInput extends IBaseInput {
	name: 'createTable'
	keys: ITableKeys
}
export interface IDeleteInput extends IBaseInput {
	name: 'delete'
	id: string
}

export interface IReadInput extends IBaseInput {
	name: 'read'
	id: string
}

export interface IReadManyInput extends IBaseInput {
	name: 'readMany'
	ids: string[]
}

export interface IDropInput extends IBaseInput {
	name: 'drop'
}

export interface IUnloadInput {
	name: 'unload'
}

export type ICommandInputs<T extends IBasicRecord | never = IBasicRecord> =
	| ICreateTableInput
	| IQueryInput<T>
	| IInsertInput<T>
	| IDeleteInput
	| IReadInput
	| IReadManyInput
	| IDropInput
	| IImportInput
	| IUnloadInput

export type ICommandInput<T extends ICommandInputs> = Omit<T, 'name'>

export type IBasicRecord = {
	id: string
	[key: string]: any
}

export interface IEncoder extends Encoder {
	decodeKeys: (tag: any) => any
}
