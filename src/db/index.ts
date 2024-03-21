import { OPFSDB } from './OPFSDB'
import {
	ICommandInput,
	ICreateTableInput,
	IQueryInput,
	IInsertInput,
	IDeleteInput,
	IReadInput,
	IDropInput,
	ICommandInputs,
	IBasicRecord,
	IQueryOptions,
	IImportInput,
	IReadManyInput,
} from './types'

const tables: Record<string, OPFSDB<any>> = {}

export const createTableCommand = async ({ tableName, keys }: ICommandInput<ICreateTableInput>) => {
	if (tables[tableName]) return
	const table = new OPFSDB(tableName, keys)
	await table.init()
	tables[tableName] = table
}

export const queryCommand = <T>({ tableName, query, ...options }: ICommandInput<IQueryInput>): Promise<T[] | string[]> => {
	return tables[tableName].query(query, options as IQueryOptions)
}

export const insertCommand = async ({ tableName, record, fullRecord }: ICommandInput<IInsertInput>): Promise<void> => {
	await tables[tableName].insert(record.id, record, fullRecord)
}

export const importCommand = async ({ tableName, records }: ICommandInput<IImportInput>): Promise<void> => {
	await tables[tableName].import(records.map(value => ({ id: value.id, value })))
}

export const deleteCommand = async ({ tableName, id }: ICommandInput<IDeleteInput>): Promise<void> => {
	await tables[tableName].delete(id)
}

export const readCommand = <T>({ tableName, id }: ICommandInput<IReadInput>): Promise<T[]> => {
	return tables[tableName].read(id)
}

export const readManyCommand = <T>({ tableName, ids }: ICommandInput<IReadManyInput>): Promise<T[]> => {
	return tables[tableName].readMany(ids)
}

export const dropCommand = async ({ tableName }: ICommandInput<IDropInput>): Promise<void> => {
	const res = await tables[tableName].drop()
	delete tables[tableName]
	return res
}

export const unloadTables = async () => {
	for (const table of Object.values(tables)) {
		table.unload()
	}
}

export const command = async <T extends IBasicRecord>(command: ICommandInputs<T>) => {
	try {
		let response: T[] | string[]
		const start = performance.now()
		switch (command.name) {
			case 'createTable':
				await createTableCommand(command as ICreateTableInput)
				break
			case 'query':
				response = await queryCommand<T>(command as IQueryInput<T>)
				break
			case 'insert':
				await insertCommand(command as IInsertInput<T>)
				break
			case 'import':
				await importCommand(command as IImportInput<T>)
				break
			case 'delete':
				await deleteCommand(command as IDeleteInput)
				break
			case 'read':
				response = (await readCommand(command as IReadInput)) as T[]
				break
			case 'readMany':
				response = (await readManyCommand(command as IReadManyInput)) as T[]
				break
			case 'drop':
				await dropCommand(command as IDropInput)
				break
			default:
				console.error(command)
				throw new Error('unknown command')
		}

		// eslint-disable-next-line no-console
		console.log(`${command.name} cmd took: ${Math.round(performance.now() - start)}ms`)
		return response!
	} catch (error) {
		console.error(error)
		throw error
	}
}
