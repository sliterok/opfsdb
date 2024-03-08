import { BPTreeCondition } from 'src/impl/bptree/BPTree'

export interface IInsertInput<T extends IBasicRecord = IBasicRecord> {
	name: 'insert'
	tableName: string
	record: T
}
export interface IQueryInput<T extends IBasicRecord = IBasicRecord> {
	name: 'query'
	tableName: string
	query: //Record<keyof T, BPTreeCondition<string | number> | never>
	{
		[key in keyof T]?: BPTreeCondition<string | number> | never
	}
}
export interface ICreateTableInput {
	name: 'createTable'
	tableName: string
	keys: string[]
}
export interface IDeleteInput {
	name: 'delete'
	tableName: string
	id: string
}

export interface IReadInput {
	name: 'read'
	tableName: string
	id: string
}

export interface IDropInput {
	name: 'drop'
	tableName: string
}

export type ICommandInputs<T extends IBasicRecord | never = IBasicRecord> =
	| ICreateTableInput
	| IQueryInput<T>
	| IInsertInput<T>
	| IDeleteInput
	| IReadInput
	| IDropInput

export type ICommandInput<T extends ICommandInputs> = Omit<T, 'name'>
export type IFetchCommandInput<T extends ICommandInputs> = Omit<T, 'tableName' | 'name'>
export type IFetchDbUrl<T extends ICommandInputs> = `/db/${string}/${T['name']}`
export type IFetchDb = <T extends ICommandInputs<J>, J extends IBasicRecord = IBasicRecord>(
	url: IFetchDbUrl<T>,
	body: IFetchCommandInput<T>
) => Promise<J[] | void>

export type IBasicRecord = {
	id: string
	[key: string]: any
}
