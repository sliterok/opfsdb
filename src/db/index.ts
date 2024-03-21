import { OPFSDB } from './OPFSDB'
import {
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

export class DatabaseManager {
	private tables: Record<string, OPFSDB<any>> = {}

	constructor() {}

	public async createTable({ tableName, keys }: ICreateTableInput): Promise<void> {
		if (this.tables[tableName]) return
		const table = new OPFSDB(tableName, keys)
		await table.init()
		this.tables[tableName] = table
	}

	public async query<T>(input: IQueryInput): Promise<T[] | string[]> {
		return this.tables[input.tableName].query(input.query, input as IQueryOptions)
	}

	public async insert<T extends IBasicRecord>({ tableName, record, fullRecord }: IInsertInput<T>): Promise<void> {
		await this.tables[tableName].insert(record.id, record, fullRecord)
	}

	public async import<T extends IBasicRecord>({ tableName, records }: IImportInput<T>): Promise<void> {
		await this.tables[tableName].import(records.map(value => ({ id: value.id, value })))
	}

	public async delete({ tableName, id }: IDeleteInput): Promise<void> {
		await this.tables[tableName].delete(id)
	}

	public async read<T>({ tableName, id }: IReadInput): Promise<T[]> {
		return this.tables[tableName].read(id)
	}

	public async readMany<T>({ tableName, ids }: IReadManyInput): Promise<T[]> {
		return this.tables[tableName].readMany(ids)
	}

	public async drop({ tableName }: IDropInput): Promise<void> {
		const res = await this.tables[tableName].drop()
		delete this.tables[tableName]
		return res
	}

	public async unloadTables(): Promise<void> {
		for (const table of Object.values(this.tables)) {
			table.unload()
		}
	}
	public async executeCommand<T extends IBasicRecord>(command: ICommandInputs<T>): Promise<T[] | string[] | void> {
		const start = performance.now()
		try {
			const response = await this.commandHandlers[command.name](command)
			// eslint-disable-next-line no-console
			console.log(`${command.name} command took: ${Math.round(performance.now() - start)}ms`)
			return response
		} catch (error) {
			console.error(`Error executing command: ${command.name}`, error)
			throw error
		}
	}

	private commandHandlers: Record<string, <CMD extends ICommandInputs>(command: CMD) => Promise<any[] | string[] | void>> = {
		createTable: cmd => this.createTable(cmd as ICreateTableInput),
		query: cmd => this.query(cmd as IQueryInput),
		insert: cmd => this.insert(cmd as IInsertInput),
		import: cmd => this.import(cmd as IImportInput),
		delete: cmd => this.delete(cmd as IDeleteInput),
		read: cmd => this.read(cmd as IReadInput),
		readMany: cmd => this.readMany(cmd as IReadManyInput),
		drop: cmd => this.drop(cmd as IDropInput),
	}
}
