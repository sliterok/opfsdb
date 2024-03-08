import { BPTreeCondition } from 'src/impl/bptree/BPTree'

export interface IInsertInput {
	name: 'insert'
	tableName: string
	record: Record<string, any>
}
export interface IQueryInput {
	name: 'query'
	tableName: string
	query: Record<string, BPTreeCondition<string | number>>
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

export type ICommandInputs = ICreateTableInput | IQueryInput | IInsertInput | IDeleteInput | IReadInput | IDropInput
export type ICommandInput<T> = Omit<T, 'name'>
export type IFetchCommandInput<T> = Omit<T, 'tableName' | 'name'>
export type IFetchDbUrl<T extends ICommandInputs> = `/db/${string}/${T['name']}`
export type IFetchDb = <T extends ICommandInputs>(url: IFetchDbUrl<T>, body: IFetchCommandInput<T>) => Promise<Record<string, any>[] | void>
